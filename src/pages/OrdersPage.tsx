import {
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Descriptions,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Timeline,
    Tooltip,
    Typography,
    message
} from "antd"
import type {ColumnsType} from "antd/es/table"
import {AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, ShoppingOutlined, ThunderboltOutlined} from "@ant-design/icons"
import {useEffect, useMemo, useRef, useState} from "react"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {
    useCancelOrderMutation,
    useCreateOrderCommentMutation,
    useGetOrderByIdQuery,
    useGetOrderHistoryQuery,
    useGetOrdersQuery,
    useGetOrdersSummaryQuery,
    useUpdateOrderMutation,
    useUpdateOrderStatusMutation
} from "../features/orders/orderApi.ts"
import type {
    AdminOrder,
    GetAdminOrdersParams,
    OrderDeliveryStatus,
    OrderHistoryItem,
    OrderItem,
    OrderPaymentStatus,
    OrderSlaSnapshot
} from "../features/orders/OrderTypes.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {useGetOrderStatusesQuery} from "../features/order-status/orderStatusApi.ts"
import {useGetSourcesQuery} from "../features/source/sourceApi.ts"
import {useGetEmployeesQuery} from "../features/admin/employeeApi.ts"
import {formatMoney} from "../utils/formatters.ts"
import {useCan} from "../features/auth/permissions.ts"
import {useSearchParams} from "react-router-dom"

const todayFilters = (): GetAdminOrdersParams => ({
    page: 1,
    pageSize: 20,
    from: dayjs().format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD")
})

const deliveryStatusValues: OrderDeliveryStatus[] = ["pending", "preparing", "ready", "delivering", "delivered", "cancelled"]
const LIVE_ALERT_POLLING_INTERVAL_MS = 30_000
const LIVE_ALERT_STORAGE_KEY = "kokoro.orders.liveAlertsEnabled"

const slaThresholdMinutes: Partial<Record<OrderDeliveryStatus, number>> = {
    pending: 15,
    preparing: 30,
    ready: 60,
    delivering: 60
}

const paymentStatusOptions: Array<{label: string; value: OrderPaymentStatus}> = [
    {label: "pending", value: "pending"},
    {label: "paid", value: "paid"},
    {label: "failed", value: "failed"},
    {label: "refunded", value: "refunded"}
]

const deliveryStatusOptions: Array<{label: string; value: OrderDeliveryStatus}> = [
    {label: "pending", value: "pending"},
    {label: "preparing", value: "preparing"},
    {label: "ready", value: "ready"},
    {label: "delivering", value: "delivering"},
    {label: "delivered", value: "delivered"},
    {label: "cancelled", value: "cancelled"}
]

const paymentStatusColor: Record<OrderPaymentStatus, string> = {
    pending: "orange",
    paid: "green",
    failed: "red",
    refunded: "purple"
}

const deliveryStatusColor: Record<OrderDeliveryStatus, string> = {
    pending: "orange",
    preparing: "blue",
    ready: "cyan",
    delivering: "geekblue",
    delivered: "green",
    cancelled: "red"
}

type StatusIntent = "accept" | "ready" | "delivered" | "cancelled"

type OrderEditFormValues = {
    sourceId?: number | null
    assignedEmployeeId?: number | null
    deliveryPrice?: number
}

const statusIntentKeywords: Record<StatusIntent, string[]> = {
    accept: ["accept", "confirm", "прин", "подтверж", "сбор", "prepar"],
    ready: ["ready", "готов"],
    delivered: ["deliver", "complete", "done", "выдан", "достав", "заверш"],
    cancelled: ["cancel", "отмен"]
}

const getOrderAgeMinutes = (createdAt?: string) => {
    if (!createdAt) return 0
    return Math.max(dayjs().diff(dayjs(createdAt), "minute"), 0)
}

const formatOrderAge = (createdAt?: string) => {
    const minutes = getOrderAgeMinutes(createdAt)
    if (minutes < 60) return `${minutes} мин`
    return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`
}

const getNextActionLabel = (order: AdminOrder) => {
    if (order.deliveryStatus === "cancelled") return "Разобрать отмену"
    if (order.deliveryStatus === "delivered") return "Закрыт"
    if (order.paymentStatus === "paid" && order.deliveryStatus === "pending") return "Принять заказ"
    if (order.deliveryStatus === "pending") return "Связаться / принять"
    if (order.deliveryStatus === "preparing") return "Собрать заказ"
    if (order.deliveryStatus === "ready") return "Выдать / доставить"
    if (order.deliveryStatus === "delivering") return "Подтвердить доставку"
    return "Проверить"
}

const getFallbackSlaSnapshot = (order: AdminOrder): OrderSlaSnapshot => {
    const thresholdMinutes = order.deliveryStatus ? slaThresholdMinutes[order.deliveryStatus] ?? null : null
    const lastStatusChangedAt = order.updatedAt || order.createdAt
    const ageMinutes = getOrderAgeMinutes(lastStatusChangedAt)

    if (!thresholdMinutes) return {lastStatusChangedAt, ageMinutes, thresholdMinutes, state: null}
    if (ageMinutes >= thresholdMinutes * 2) return {lastStatusChangedAt, ageMinutes, thresholdMinutes, state: "stuck"}
    if (ageMinutes >= thresholdMinutes) return {lastStatusChangedAt, ageMinutes, thresholdMinutes, state: "waiting"}
    return {lastStatusChangedAt, ageMinutes, thresholdMinutes, state: "new"}
}

const getOrderSlaSnapshot = (order: AdminOrder) => order.sla || getFallbackSlaSnapshot(order)

const getOrderBadges = (order: AdminOrder) => {
    const badges: Array<{label: string; color: string}> = []
    const age = getOrderAgeMinutes(order.createdAt)
    const sla = getOrderSlaSnapshot(order)

    if (order.deliveryStatus === "pending") badges.push({label: "Новый", color: "orange"})
    if (order.paymentStatus === "paid") badges.push({label: "Оплачен", color: "green"})
    if (order.paymentStatus === "pending") badges.push({label: "Ждёт оплату", color: "gold"})
    if (order.deliveryStatus === "pending" && age >= 10) badges.push({label: "Ждёт 10+ мин", color: "red"})
    if (sla.state === "waiting") badges.push({label: `SLA ждёт ${sla.ageMinutes} мин`, color: "red"})
    if (sla.state === "stuck") badges.push({label: `Завис ${sla.ageMinutes} мин`, color: "volcano"})
    if (order.deliveryStatus === "ready") badges.push({label: "Готов", color: "cyan"})
    if (order.deliveryStatus === "cancelled" && order.paymentStatus === "paid") {
        badges.push({label: "Paid + Cancelled", color: "volcano"})
    }

    return badges
}

const getHistoryDate = (item: OrderHistoryItem) => item.changedAt || item.createdAt

const canUseBrowserNotifications = () => typeof window !== "undefined" && "Notification" in window

const playLiveAlertSound = () => {
    const AudioContextConstructor = window.AudioContext || (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext
    if (!AudioContextConstructor) return

    const audioContext = new AudioContextConstructor()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    gain.gain.setValueAtTime(0.001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.35)
}

const showBrowserOrderNotification = (title: string, body: string) => {
    if (!canUseBrowserNotifications() || Notification.permission !== "granted") return
    new Notification(title, {body, tag: "kokoro-live-orders"})
}
const getHistoryStatusTitle = (item: OrderHistoryItem, side: "from" | "to") => {
    if (side === "from") return item.fromStatus?.title || item.fromStatusId || "—"
    return item.toStatus?.title || item.toStatusId || "—"
}

const OrdersPage = () => {
    const [searchParams] = useSearchParams()
    const initialDeliveryStatus = searchParams.get("deliveryStatus")
    const [filters, setFilters] = useState<GetAdminOrdersParams>(() => ({
        ...todayFilters(),
        deliveryStatus: deliveryStatusValues.includes(initialDeliveryStatus as OrderDeliveryStatus)
            ? initialDeliveryStatus as OrderDeliveryStatus
            : undefined
    }))
    const [problemOnly, setProblemOnly] = useState(searchParams.get("problemOnly") === "1")
    const [attentionOnly, setAttentionOnly] = useState(searchParams.get("attentionOnly") === "1")
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
    const [actionOrderId, setActionOrderId] = useState<number | null>(null)
    const [liveAlertsEnabled, setLiveAlertsEnabled] = useState(() => localStorage.getItem(LIVE_ALERT_STORAGE_KEY) !== "0")
    const lastSummaryRef = useRef<{newOrders: number; problemToday: number} | null>(null)
    const seenOrderIdsRef = useRef<Set<number>>(new Set())
    const hasPrimedLiveAlertsRef = useRef(false)

    const [isStatusModalOpen, setStatusModalOpen] = useState(false)
    const [isCancelModalOpen, setCancelModalOpen] = useState(false)
    const [isCommentModalOpen, setCommentModalOpen] = useState(false)
    const [isEditModalOpen, setEditModalOpen] = useState(false)
    const [statusForm] = Form.useForm<{statusId: number; comment?: string; visibleForClient?: boolean}>()
    const [cancelForm] = Form.useForm<{reason?: string}>()
    const [commentForm] = Form.useForm<{message: string; visibleForClient?: boolean}>()
    const [editForm] = Form.useForm<OrderEditFormValues>()

    const {data: statuses} = useGetOrderStatusesQuery()
    const {data: sources} = useGetSourcesQuery()
    const {data: employees} = useGetEmployeesQuery()
    const {data: summary} = useGetOrdersSummaryQuery(undefined, {
        pollingInterval: LIVE_ALERT_POLLING_INTERVAL_MS,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })
    const {data, isLoading, isFetching} = useGetOrdersQuery({...filters, problemOnly, attentionOnly}, {
        pollingInterval: LIVE_ALERT_POLLING_INTERVAL_MS,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })
    const {data: selectedOrder, isFetching: isOrderLoading} = useGetOrderByIdQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const {data: orderHistory} = useGetOrderHistoryQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const [updateOrder, {isLoading: isUpdatingOrder}] = useUpdateOrderMutation()
    const [updateOrderStatus, {isLoading: isUpdatingStatus}] = useUpdateOrderStatusMutation()
    const [cancelOrder, {isLoading: isCancelling}] = useCancelOrderMutation()
    const [createOrderComment, {isLoading: isCreatingComment}] = useCreateOrderCommentMutation()
    const canUpdateOrders = useCan("orders.update")
    const canDeleteOrders = useCan("orders.delete")
    const notificationPermission = canUseBrowserNotifications() ? Notification.permission : null
    const liveAlertsHint = !canUseBrowserNotifications()
        ? "Браузер не поддерживает desktop-уведомления; звуковой сигнал останется доступен."
        : notificationPermission === "denied"
            ? "Desktop-уведомления запрещены в браузере. Разрешите их в настройках сайта, чтобы получать алерты вне вкладки."
            : liveAlertsEnabled
                ? "Алерты активны: новые и проблемные заказы будут сопровождаться звуком и, при разрешении браузера, desktop-уведомлением."
                : "Алерты выключены для этого браузера. Включите их перед сменой, чтобы не пропустить новые и проблемные заказы."
    const currentActionOrderId = actionOrderId ?? selectedOrderId
    const currentItems = useMemo(() => data?.items || [], [data?.items])
    const editingOrder = useMemo(
        () => selectedOrder?.id === currentActionOrderId
            ? selectedOrder
            : currentItems.find((order) => order.id === currentActionOrderId),
        [currentActionOrderId, currentItems, selectedOrder]
    )

    useEffect(() => {
        localStorage.setItem(LIVE_ALERT_STORAGE_KEY, liveAlertsEnabled ? "1" : "0")
    }, [liveAlertsEnabled])

    useEffect(() => {
        if (!summary) return

        const currentSummary = {
            newOrders: summary.newOrders ?? 0,
            problemToday: summary.problemToday ?? 0
        }
        const previousSummary = lastSummaryRef.current
        lastSummaryRef.current = currentSummary

        if (!previousSummary) return

        const hasMoreNewOrders = currentSummary.newOrders > previousSummary.newOrders
        const hasMoreProblemOrders = currentSummary.problemToday > previousSummary.problemToday

        if (!liveAlertsEnabled || (!hasMoreNewOrders && !hasMoreProblemOrders)) return

        const title = hasMoreNewOrders ? "Новый заказ Kokoro" : "Проблемный заказ Kokoro"
        const body = hasMoreNewOrders
            ? "Появился новый заказ. Проверьте Today Order Desk."
            : "Количество проблемных заказов выросло. Проверьте Today Order Desk."

        playLiveAlertSound()
        showBrowserOrderNotification(title, body)
        message.info(body)
    }, [liveAlertsEnabled, summary])

    useEffect(() => {
        if (!currentItems.length) return

        const currentIds = new Set(currentItems.map((order) => order.id))
        const previousIds = seenOrderIdsRef.current

        if (!hasPrimedLiveAlertsRef.current) {
            seenOrderIdsRef.current = currentIds
            hasPrimedLiveAlertsRef.current = true
            return
        }

        const newPendingOrder = currentItems.find((order) => !previousIds.has(order.id) && order.deliveryStatus === "pending")
        seenOrderIdsRef.current = currentIds

        if (!liveAlertsEnabled || !newPendingOrder) return

        const orderLabel = newPendingOrder.orderNumber || `#${newPendingOrder.id}`
        const body = `Новый заказ ${orderLabel}. Клиентские данные скрыты.`
        playLiveAlertSound()
        showBrowserOrderNotification("Новый заказ Kokoro", body)
        message.info(body)
    }, [currentItems, liveAlertsEnabled])

    const handleLiveAlertsChange = async (enabled: boolean) => {
        if (enabled && canUseBrowserNotifications() && Notification.permission === "default") {
            await Notification.requestPermission()
        }
        setLiveAlertsEnabled(enabled)
    }

    const findStatusByIntent = (intent: StatusIntent) => {
        const keywords = statusIntentKeywords[intent]
        return [...(statuses || [])]
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
            .find((status) => keywords.some((keyword) => status.title.toLowerCase().includes(keyword)))
    }

    const openOrder = (id: number) => setSelectedOrderId(id)
    const selectedPhone = selectedOrder?.client?.phone || selectedOrder?.phone

    const openStatusModal = (id: number) => {
        setActionOrderId(id)
        setStatusModalOpen(true)
    }

    const openEditModal = (order: AdminOrder) => {
        setActionOrderId(order.id)
        editForm.setFieldsValue({
            sourceId: order.source?.id ?? null,
            assignedEmployeeId: order.assignedEmployee?.id ?? null,
            deliveryPrice: order.deliveryPrice ?? 0
        })
        setEditModalOpen(true)
    }

    const openCancelModal = (id: number) => {
        setActionOrderId(id)
        setCancelModalOpen(true)
    }

    const openQuickStatusModal = (order: AdminOrder, intent: StatusIntent) => {
        const status = findStatusByIntent(intent)
        setActionOrderId(order.id)
        statusForm.setFieldsValue({
            statusId: status?.id,
            comment: `Операционное действие: ${getNextActionLabel(order)}`,
            visibleForClient: true
        })
        setStatusModalOpen(true)
        if (!status) {
            message.warning("Не нашла подходящий статус. Выберите статус вручную.")
        }
    }

    const openNextActionModal = (order: AdminOrder) => {
        if (order.deliveryStatus === "pending") return openQuickStatusModal(order, "accept")
        if (order.deliveryStatus === "preparing") return openQuickStatusModal(order, "ready")
        if (order.deliveryStatus === "ready" || order.deliveryStatus === "delivering") return openQuickStatusModal(order, "delivered")
        openStatusModal(order.id)
    }

    const closeStatusModal = () => {
        setStatusModalOpen(false)
        setActionOrderId(null)
        statusForm.resetFields()
    }

    const closeCancelModal = () => {
        setCancelModalOpen(false)
        setActionOrderId(null)
        cancelForm.resetFields()
    }

    const closeCommentModal = () => {
        setCommentModalOpen(false)
        setActionOrderId(null)
        commentForm.resetFields()
    }

    const closeEditModal = () => {
        setEditModalOpen(false)
        setActionOrderId(null)
        editForm.resetFields()
    }

    const setTodayFilters = () => {
        setProblemOnly(false)
        setAttentionOnly(false)
        setFilters(todayFilters())
    }
    const setAllFilters = () => {
        setProblemOnly(false)
        setAttentionOnly(false)
        setFilters({page: 1, pageSize: 20})
    }
    const setDeliveryFilter = (deliveryStatus?: OrderDeliveryStatus) => {
        setProblemOnly(false)
        setAttentionOnly(false)
        setFilters((prev) => ({...prev, deliveryStatus, page: 1}))
    }

    const copyPhone = async (phone?: string | null) => {
        if (!phone) return
        try {
            await navigator.clipboard.writeText(phone)
            message.success("Телефон скопирован")
        } catch {
            message.error("Не удалось скопировать телефон")
        }
    }

    const handleEditSubmit = async () => {
        if (!currentActionOrderId) return
        try {
            const values = await editForm.validateFields()
            await updateOrder({
                id: currentActionOrderId,
                body: {
                    sourceId: values.sourceId ?? null,
                    assignedEmployeeId: values.assignedEmployeeId ?? null,
                    deliveryPrice: Number(values.deliveryPrice || 0)
                }
            }).unwrap()
            message.success("Данные заказа обновлены")
            closeEditModal()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleStatusSubmit = async () => {
        if (!currentActionOrderId) return
        try {
            const values = await statusForm.validateFields()
            await updateOrderStatus({
                id: currentActionOrderId,
                body: {
                    statusId: values.statusId,
                    comment: values.comment,
                    visibleForClient: values.visibleForClient
                }
            }).unwrap()
            message.success("Статус заказа обновлён")
            closeStatusModal()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleCancelSubmit = async () => {
        if (!currentActionOrderId) return
        try {
            const values = await cancelForm.validateFields()
            await cancelOrder({id: currentActionOrderId, reason: values.reason}).unwrap()
            message.success("Заказ отменён")
            closeCancelModal()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleCommentSubmit = async () => {
        if (!currentActionOrderId) return
        try {
            const values = await commentForm.validateFields()
            await createOrderComment({
                id: currentActionOrderId,
                body: {
                    message: values.message,
                    visibleForClient: values.visibleForClient
                }
            }).unwrap()
            message.success("Комментарий добавлен")
            closeCommentModal()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const orderColumns: ColumnsType<AdminOrder> = [
            {
                title: "Заказ",
                key: "orderNumber",
                width: 130,
                render: (_, order) => (
                    <Space orientation="vertical" size={0}>
                        <Typography.Text strong>{order.orderNumber || `#${order.id}`}</Typography.Text>
                        <Typography.Text type="secondary">{dayjs(order.createdAt).format("HH:mm")}</Typography.Text>
                    </Space>
                )
            },
            {
                title: "SLA",
                key: "sla",
                width: 145,
                render: (_, order) => {
                    const sla = getOrderSlaSnapshot(order)
                    const color = sla.state === "stuck" ? "volcano" : sla.state === "waiting" ? "red" : "default"
                    const label = sla.thresholdMinutes ? `${sla.ageMinutes}/${sla.thresholdMinutes} мин` : formatOrderAge(order.createdAt)
                    return (
                        <Tooltip title={sla.lastStatusChangedAt ? `С последнего статуса: ${dayjs(sla.lastStatusChangedAt).format("DD.MM.YYYY HH:mm")}` : "С момента создания"}>
                            <Tag color={color}>{label}</Tag>
                        </Tooltip>
                    )
                }
            },
            {
                title: "Клиент",
                key: "client",
                width: 220,
                render: (_, order) => {
                    const phone = order.client?.phone || order.phone
                    return (
                        <Space orientation="vertical" size={0}>
                            <Typography.Text>{order.client?.name || order.clientName || "—"}</Typography.Text>
                            <Typography.Text copyable={Boolean(phone)} type="secondary">{phone || "—"}</Typography.Text>
                        </Space>
                    )
                }
            },
            {
                title: "Сумма",
                dataIndex: "total",
                width: 140,
                render: (total: number) => <Typography.Text strong>{formatMoney(total)}</Typography.Text>
            },
            {
                title: "Статусы",
                key: "statuses",
                width: 230,
                render: (_, order) => (
                    <Space wrap size={[0, 4]}>
                        {order.status?.title && <Tag color="blue">{order.status.title}</Tag>}
                        {order.paymentStatus && <Tag color={paymentStatusColor[order.paymentStatus]}>{order.paymentStatus}</Tag>}
                        {order.deliveryStatus && <Tag color={deliveryStatusColor[order.deliveryStatus]}>{order.deliveryStatus}</Tag>}
                    </Space>
                )
            },
            {
                title: "Операционные метки",
                key: "badges",
                width: 210,
                render: (_, order) => (
                    <Space wrap size={[0, 4]}>
                        {getOrderBadges(order).map((badge) => <Tag key={badge.label} color={badge.color}>{badge.label}</Tag>)}
                    </Space>
                )
            },
            {
                title: "Следующий шаг",
                key: "nextAction",
                width: 170,
                render: (_, order) => <Typography.Text>{getNextActionLabel(order)}</Typography.Text>
            },
            {
                title: "Источник",
                key: "source",
                width: 130,
                render: (_, order) => order.source?.title || "—"
            },
            {
                title: "Товары",
                key: "items",
                width: 90,
                render: (_, order) => order.itemsCount ?? order.items?.length ?? 0
            },
            {
                title: "Действия",
                key: "actions",
                width: 300,
                fixed: "right",
                render: (_, order) => (
                    <Space>
                        <Button onClick={() => openOrder(order.id)}>Открыть</Button>
                        {canUpdateOrders && <Button type="primary" onClick={() => openNextActionModal(order)}>{getNextActionLabel(order)}</Button>}
                        {canUpdateOrders && <Button onClick={() => openEditModal(order)}>Правки</Button>}
                        {canUpdateOrders && <Button onClick={() => openStatusModal(order.id)}>Статус</Button>}
                        {canDeleteOrders && <Button danger onClick={() => openCancelModal(order.id)}>Отмена</Button>}
                    </Space>
                )
            }
    ]

    const itemColumns: ColumnsType<OrderItem> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Товар", key: "variant", render: (_, item) => item.productVariant?.title || "—"},
        {title: "Описание", key: "description", render: (_, item) => item.productVariant?.description || "—"},
        {title: "Размер", key: "size", render: (_, item) => item.size?.title || "—"},
        {title: "Qty", dataIndex: "qty", width: 80},
        {title: "Цена", dataIndex: "price", width: 130, render: (value: number) => formatMoney(value)},
        {title: "Скидка", dataIndex: "discount", width: 110, render: (value: number) => formatMoney(value || 0)},
        {title: "Акция", dataIndex: "promotion", width: 100, render: (value: boolean) => (value ? "Да" : "Нет")}
    ]

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <Card className="admin-hero-card orders-hero">
                <PageHeading
                    title="Today Order Desk"
                    subtitle="Операционный центр заказов: быстрые фильтры, красные риски и следующий шаг без чтения всей таблицы."
                />
                <Space wrap className="hero-badges">
                    <Badge status="processing" text="Сегодня по умолчанию" />
                    <Badge status={(summary?.problemToday ?? 0) > 0 ? "error" : "success"} text={`${summary?.problemToday ?? 0} проблемных`} />
                    <Badge status="warning" text="SLA: новые 10+ мин подсвечиваются" />
                    <Badge status={isFetching ? "processing" : "success"} text="Live refresh: 30 сек" />
                </Space>
            </Card>

            <Card className="filter-card">
                <Space orientation="vertical" size={6} style={{width: "100%"}}>
                    <Space wrap align="center">
                        <Badge status={liveAlertsEnabled ? "processing" : "default"} text={liveAlertsEnabled ? "Live Ops Alert включён" : "Live Ops Alert выключен"} />
                        <Checkbox checked={liveAlertsEnabled} onChange={(event) => handleLiveAlertsChange(event.target.checked)}>
                            {liveAlertsEnabled ? "Звук и desktop-уведомления включены" : "Включить звук и desktop-уведомления"}
                        </Checkbox>
                    </Space>
                    <Typography.Text type={notificationPermission === "denied" ? "danger" : "secondary"}>
                        {liveAlertsHint} Заказы и summary обновляются автоматически каждые 30 секунд; уведомления не содержат ФИО или телефон клиента.
                    </Typography.Text>
                </Space>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className="metric-card metric-card--lime"><Statistic prefix={<ShoppingOutlined />} title="Заказы сегодня" value={summary?.ordersToday ?? 0} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className="metric-card metric-card--orange"><Statistic prefix={<ClockCircleOutlined />} title="Новые" value={summary?.newOrders ?? 0} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className="metric-card metric-card--money"><Statistic prefix={<FireOutlined />} title="Выручка сегодня" value={formatMoney(summary?.revenueToday ?? 0)} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className="metric-card metric-card--blue"><Statistic prefix={<ThunderboltOutlined />} title="В работе" value={summary?.inProgressToday ?? 0} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className="metric-card metric-card--cyan"><Statistic prefix={<CheckCircleOutlined />} title="Готовы" value={summary?.readyToday ?? 0} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={4}>
                    <Card className={(summary?.problemToday ?? 0) > 0 ? "metric-card metric-card--danger" : "metric-card"}><Statistic prefix={<AlertOutlined />} title="Проблемные" value={summary?.problemToday ?? 0} /></Card>
                </Col>
            </Row>

            <Card className="filter-card">
                <Space orientation="vertical" size={14} style={{width: "100%"}}>
                    <Space wrap>
                        <Button type={filters.from && filters.to ? "primary" : "default"} onClick={setTodayFilters}>Сегодня</Button>
                        <Button onClick={() => setDeliveryFilter("pending")}>Новые</Button>
                        <Button onClick={() => setDeliveryFilter("preparing")}>В работе</Button>
                        <Button onClick={() => setDeliveryFilter("ready")}>Готовы</Button>
                        <Button onClick={() => setDeliveryFilter("delivered")}>Завершённые</Button>
                        <Button danger onClick={() => setDeliveryFilter("cancelled")}>Отменённые</Button>
                        <Button danger={problemOnly} type={problemOnly ? "primary" : "default"} onClick={() => {
                            setAttentionOnly(false)
                            setProblemOnly((prev) => !prev)
                            setFilters((prev) => ({...prev, page: 1}))
                        }}>Проблемные</Button>
                        <Button danger={attentionOnly} type={attentionOnly ? "primary" : "default"} onClick={() => {
                            setProblemOnly(false)
                            setAttentionOnly((prev) => !prev)
                            setFilters((prev) => ({...prev, page: 1}))
                        }}>Требуют внимания</Button>
                        <Button onClick={setAllFilters}>Все</Button>
                    </Space>
                    <Space wrap>
                        <Input.Search
                            placeholder="Поиск по номеру, клиенту, телефону"
                            allowClear
                            onSearch={(search) => setFilters((prev) => ({...prev, search, page: 1}))}
                            style={{width: 320}}
                        />
                        <Select
                            allowClear
                            placeholder="Статус заказа"
                            style={{width: 180}}
                            options={statuses?.map((status) => ({label: status.title, value: status.id}))}
                            onChange={(statusId) => setFilters((prev) => ({...prev, statusId, page: 1}))}
                        />
                        <Select
                            allowClear
                            placeholder="Статус оплаты"
                            style={{width: 180}}
                            options={paymentStatusOptions}
                            onChange={(paymentStatus) => setFilters((prev) => ({...prev, paymentStatus, page: 1}))}
                        />
                        <Select
                            allowClear
                            placeholder="Статус доставки"
                            style={{width: 200}}
                            options={deliveryStatusOptions}
                            value={filters.deliveryStatus}
                            onChange={(deliveryStatus) => setFilters((prev) => ({...prev, deliveryStatus, page: 1}))}
                        />
                        <DatePicker.RangePicker
                            value={filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null}
                            onChange={(dates) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    from: dates?.[0]?.format("YYYY-MM-DD"),
                                    to: dates?.[1]?.format("YYYY-MM-DD"),
                                    page: 1
                                }))
                            }}
                        />
                        <Button onClick={setTodayFilters}>Сброс к сегодня</Button>
                    </Space>
                </Space>
            </Card>

            <Card className="admin-table-card orders-table-card">
                <Table<AdminOrder>
                    rowKey="id"
                    loading={isLoading}
                    dataSource={currentItems}
                    columns={orderColumns}
                    scroll={{x: 1600}}
                    rowClassName={(order) => getOrderBadges(order).some((badge) => badge.color === "red" || badge.color === "volcano") ? "table-row-alert" : ""}
                    pagination={{
                        current: data?.page || filters.page || 1,
                        pageSize: data?.pageSize || filters.pageSize || 20,
                        total: data?.total || 0,
                        onChange: (page, pageSize) => setFilters((prev) => ({...prev, page, pageSize}))
                    }}
                />
            </Card>

            <Drawer
                title={selectedOrder ? `Заказ ${selectedOrder.orderNumber || `#${selectedOrder.id}`}` : "Карточка заказа"}
                open={Boolean(selectedOrderId)}
                onClose={() => setSelectedOrderId(null)}
                width={1100}
                extra={selectedOrder && canUpdateOrders ? (
                    <Space>
                        <Button onClick={() => openEditModal(selectedOrder)}>Правки</Button>
                        <Button type="primary" onClick={() => openNextActionModal(selectedOrder)}>{getNextActionLabel(selectedOrder)}</Button>
                    </Space>
                ) : null}
            >
                {isOrderLoading && <Typography.Text type="secondary">Загрузка...</Typography.Text>}
                {!isOrderLoading && selectedOrder && (
                    <Space orientation="vertical" size={16} style={{width: "100%"}}>
                        <Card className="drawer-command-card">
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={8}>
                                    <Typography.Title level={4} style={{margin: 0}}>{selectedOrder.orderNumber || `#${selectedOrder.id}`}</Typography.Title>
                                    <Typography.Text type="secondary">Создан {dayjs(selectedOrder.createdAt).format("DD.MM.YYYY HH:mm")}</Typography.Text>
                                </Col>
                                <Col xs={24} md={10}>
                                    <Space wrap>
                                        {selectedOrder.status?.title && <Tag color="blue">{selectedOrder.status.title}</Tag>}
                                        {selectedOrder.paymentStatus && <Tag color={paymentStatusColor[selectedOrder.paymentStatus]}>{selectedOrder.paymentStatus}</Tag>}
                                        {selectedOrder.deliveryStatus && <Tag color={deliveryStatusColor[selectedOrder.deliveryStatus]}>{selectedOrder.deliveryStatus}</Tag>}
                                        <Tag>{formatOrderAge(selectedOrder.createdAt)}</Tag>
                                        {getOrderBadges(selectedOrder).map((badge) => <Tag key={badge.label} color={badge.color}>{badge.label}</Tag>)}
                                    </Space>
                                </Col>
                                <Col xs={24} md={6} style={{textAlign: "right"}}>
                                    <Typography.Title level={4} style={{margin: 0}}>{formatMoney(selectedOrder.total)}</Typography.Title>
                                    <Typography.Text type="secondary">Следующий шаг: {getNextActionLabel(selectedOrder)}</Typography.Text>
                                </Col>
                            </Row>
                        </Card>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={15}>
                                <Space orientation="vertical" size={16} style={{width: "100%"}}>
                                    <Card className="workflow-card" title="Workflow заказа">
                                        <Space wrap>
                                            {["Новый", "Принят", "Собирается", "Готов", "Выдан/доставлен", "Закрыт"].map((step) => <Tag key={step}>{step}</Tag>)}
                                        </Space>
                                    </Card>

                                    <Card className="admin-table-card" title="Товары">
                                        <Table<OrderItem>
                                            rowKey="id"
                                            columns={itemColumns}
                                            dataSource={selectedOrder.items || []}
                                            pagination={false}
                                            scroll={{x: 1000}}
                                        />
                                    </Card>

                                    <Card
                                        className="timeline-card"
                                        title="История событий"
                                        extra={canUpdateOrders ? <Button onClick={() => setCommentModalOpen(true)}>Добавить комментарий</Button> : null}
                                    >
                                        <Timeline
                                            items={(orderHistory || selectedOrder.histories || []).map((item) => ({
                                                children: (
                                                    <div>
                                                        <Typography.Text>{getHistoryDate(item) ? dayjs(getHistoryDate(item)).format("DD.MM.YYYY HH:mm") : "—"}</Typography.Text>
                                                        <div>{getHistoryStatusTitle(item, "from")} → {getHistoryStatusTitle(item, "to")}</div>
                                                        {item.changedBy && <Typography.Text type="secondary">{item.changedBy}</Typography.Text>}
                                                        {item.comment && <div><Typography.Text type="secondary">{item.comment}</Typography.Text></div>}
                                                    </div>
                                                )
                                            }))}
                                        />
                                    </Card>
                                </Space>
                            </Col>

                            <Col xs={24} lg={9}>
                                <Space orientation="vertical" size={16} style={{width: "100%"}}>
                                    <Card className="next-action-card" title="Следующее действие">
                                        <Typography.Text strong>{getNextActionLabel(selectedOrder)}</Typography.Text>
                                        <div style={{marginTop: 12}}>
                                            <Space wrap>
                                                {canUpdateOrders && <Button type="primary" onClick={() => openNextActionModal(selectedOrder)}>{getNextActionLabel(selectedOrder)}</Button>}
                                                {canUpdateOrders && <Button onClick={() => openEditModal(selectedOrder)}>Операционные правки</Button>}
                                                {canUpdateOrders && <Button onClick={() => openStatusModal(selectedOrder.id)}>Другой статус</Button>}
                                                {selectedPhone && <Tooltip title="Скопировать телефон"><Button onClick={() => copyPhone(selectedPhone)}>Телефон</Button></Tooltip>}
                                                {canDeleteOrders && <Button danger onClick={() => openCancelModal(selectedOrder.id)}>Отменить</Button>}
                                            </Space>
                                        </div>
                                    </Card>

                                    <Card title="CRM/клиентские операции">
                                        <Alert
                                            type="info"
                                            showIcon
                                            message="CRM-действия пока недоступны из карточки заказа"
                                            description="В API карточки заказа нет безопасных операций для слияния дублей, редактирования адресной книги или истории клиента. Кнопки ниже оставлены как явные placeholders, чтобы не имитировать несуществующее поведение."
                                        />
                                        <Space wrap style={{marginTop: 12}}>
                                            <Button disabled>Объединить дубль клиента</Button>
                                            <Button disabled>Редактировать адрес клиента</Button>
                                            <Button disabled>Открыть историю клиента</Button>
                                        </Space>
                                    </Card>

                                    <Descriptions title="Клиент и доставка" bordered size="small" column={1}>
                                        <Descriptions.Item label="Клиент">{selectedOrder.client?.name || selectedOrder.clientName || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Телефон">{selectedPhone || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Адрес">{selectedOrder.clientAddress?.address || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Источник">{selectedOrder.source?.title || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Способ оплаты">{selectedOrder.paymentMethod?.title || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Тип доставки">{selectedOrder.deliveryType?.title || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Назначенный сотрудник">
                                            {selectedOrder.assignedEmployee
                                                ? `${selectedOrder.assignedEmployee.firstName} ${selectedOrder.assignedEmployee.lastName}`
                                                : "—"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Комментарий">{selectedOrder.comment || "—"}</Descriptions.Item>
                                    </Descriptions>

                                    <Descriptions title="Суммы" bordered size="small" column={1}>
                                        <Descriptions.Item label="Subtotal">{formatMoney(selectedOrder.subtotal ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Discount">{formatMoney(selectedOrder.discountTotal ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Promo">{selectedOrder.promoCode || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Promo discount">{formatMoney(selectedOrder.promoDiscount ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Bonus spent">{formatMoney(selectedOrder.bonusSpent ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Bonus earned">{formatMoney(selectedOrder.bonusEarned ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Delivery">{formatMoney(selectedOrder.deliveryPrice ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Total">{formatMoney(selectedOrder.total)}</Descriptions.Item>
                                        <Descriptions.Item label="Cancel reason">{selectedOrder.cancelReason || "—"}</Descriptions.Item>
                                    </Descriptions>
                                </Space>
                            </Col>
                        </Row>
                    </Space>
                )}
            </Drawer>


            <Modal
                title="Операционные правки заказа"
                open={isEditModalOpen}
                onCancel={closeEditModal}
                onOk={handleEditSubmit}
                confirmLoading={isUpdatingOrder}
                okText="Сохранить"
            >
                <Space orientation="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Только безопасные поля"
                        description="Статус, отмена и комментарии остаются в отдельных действиях, чтобы не смешивать workflow с менеджерскими корректировками."
                    />
                    <Form form={editForm} layout="vertical">
                        <Form.Item label="Способ оплаты">
                            <Select
                                disabled
                                placeholder="Нет API списка способов оплаты"
                                value={editingOrder?.paymentMethod?.id}
                                options={editingOrder?.paymentMethod ? [{label: editingOrder.paymentMethod.title, value: editingOrder.paymentMethod.id}] : []}
                            />
                            <Typography.Text type="secondary">Изменение способа оплаты появится после API справочника payment methods.</Typography.Text>
                        </Form.Item>
                        <Form.Item label="Тип доставки">
                            <Select
                                disabled
                                placeholder="Нет API списка типов доставки"
                                value={editingOrder?.deliveryType?.id}
                                options={editingOrder?.deliveryType ? [{label: editingOrder.deliveryType.title, value: editingOrder.deliveryType.id}] : []}
                            />
                            <Typography.Text type="secondary">Тип доставки не меняем без справочника delivery types, чтобы не отправить неверный id.</Typography.Text>
                        </Form.Item>
                        <Form.Item name="deliveryPrice" label="Стоимость доставки">
                            <InputNumber min={0} precision={0} style={{width: "100%"}} addonAfter="UZS" />
                        </Form.Item>
                        <Form.Item name="sourceId" label="Источник">
                            <Select
                                allowClear
                                placeholder="Выберите источник"
                                options={sources?.map((source) => ({label: source.title, value: source.id}))}
                            />
                        </Form.Item>
                        <Form.Item name="assignedEmployeeId" label="Ответственный сотрудник">
                            <Select
                                allowClear
                                placeholder="Назначить сотрудника"
                                options={employees?.filter((employee) => employee.isActive).map((employee) => ({
                                    label: `${employee.firstName} ${employee.lastName}`,
                                    value: employee.id
                                }))}
                            />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>

            <Modal
                title="Смена статуса"
                open={isStatusModalOpen}
                onCancel={closeStatusModal}
                onOk={handleStatusSubmit}
                confirmLoading={isUpdatingStatus}
            >
                <Form form={statusForm} layout="vertical">
                    <Form.Item name="statusId" label="Новый статус" rules={[{required: true, message: "Выберите статус"}]}>
                        <Select options={statuses?.map((status) => ({label: status.title, value: status.id}))} />
                    </Form.Item>
                    <Form.Item name="comment" label="Комментарий">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="visibleForClient" valuePropName="checked">
                        <Checkbox>Показывать клиенту</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Отмена заказа"
                open={isCancelModalOpen}
                onCancel={closeCancelModal}
                onOk={handleCancelSubmit}
                confirmLoading={isCancelling}
            >
                <Form form={cancelForm} layout="vertical">
                    <Form.Item name="reason" label="Причина отмены" rules={[{required: true, message: "Укажите причину отмены"}]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Комментарий к заказу"
                open={isCommentModalOpen}
                onCancel={closeCommentModal}
                onOk={handleCommentSubmit}
                confirmLoading={isCreatingComment}
            >
                <Form form={commentForm} layout="vertical">
                    <Form.Item name="message" label="Комментарий" rules={[{required: true, message: "Введите комментарий"}]}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="visibleForClient" valuePropName="checked">
                        <Checkbox>Показывать клиенту</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default OrdersPage
