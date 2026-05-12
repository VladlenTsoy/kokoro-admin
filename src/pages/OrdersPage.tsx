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
    Empty,
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
import {AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, CopyOutlined, FireOutlined, ShoppingOutlined, ThunderboltOutlined} from "@ant-design/icons"
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
import {useNavigate, useSearchParams} from "react-router-dom"
import {deliveryStatusMeta, paymentStatusMeta} from "../utils/adminStatusMeta.ts"
import {isAntdFormValidationError} from "../utils/isAntdFormValidationError.ts"

const todayFilters = (): GetAdminOrdersParams => ({
    page: 1,
    pageSize: 20,
    from: dayjs().format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD")
})

const paymentStatusValues: OrderPaymentStatus[] = ["pending", "paid", "failed", "refunded"]
const deliveryStatusValues: OrderDeliveryStatus[] = ["pending", "preparing", "ready", "delivering", "delivered", "cancelled"]
const LIVE_ALERT_POLLING_INTERVAL_MS = 30_000
const STALE_REFRESH_WARNING_MS = LIVE_ALERT_POLLING_INTERVAL_MS * 3
const LIVE_ALERT_STORAGE_KEY = "kokoro.orders.liveAlertsEnabled"

const slaThresholdMinutes: Partial<Record<OrderDeliveryStatus, number>> = {
    pending: 15,
    preparing: 30,
    ready: 60,
    delivering: 60
}

const paymentStatusOptions: Array<{label: string; value: OrderPaymentStatus}> = Object.entries(paymentStatusMeta).map(([value, meta]) => ({
    label: meta.label,
    value: value as OrderPaymentStatus
}))

const deliveryStatusOptions: Array<{label: string; value: OrderDeliveryStatus}> = Object.entries(deliveryStatusMeta).map(([value, meta]) => ({
    label: meta.label,
    value: value as OrderDeliveryStatus
}))

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

const getPositiveOrderIdFromSearch = (searchParams: URLSearchParams) => {
    const orderId = Number(searchParams.get("orderId"))
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null
}

const getPositiveNumberFromSearch = (searchParams: URLSearchParams, key: string) => {
    const value = Number(searchParams.get(key))
    return Number.isInteger(value) && value > 0 ? value : undefined
}

const getPaymentStatusFromSearch = (searchParams: URLSearchParams) => {
    const paymentStatus = searchParams.get("paymentStatus")
    return paymentStatusValues.includes(paymentStatus as OrderPaymentStatus) ? paymentStatus as OrderPaymentStatus : undefined
}

const getDeliveryStatusFromSearch = (searchParams: URLSearchParams) => {
    const deliveryStatus = searchParams.get("deliveryStatus")
    return deliveryStatusValues.includes(deliveryStatus as OrderDeliveryStatus) ? deliveryStatus as OrderDeliveryStatus : undefined
}

const getDateFromSearch = (searchParams: URLSearchParams, key: string) => {
    const value = searchParams.get(key)
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).format("YYYY-MM-DD") === value ? value : undefined
}

const getInitialOrderFiltersFromSearch = (searchParams: URLSearchParams): GetAdminOrdersParams => {
    const from = getDateFromSearch(searchParams, "from")
    const to = getDateFromSearch(searchParams, "to")

    return {
        ...todayFilters(),
        statusId: getPositiveNumberFromSearch(searchParams, "statusId"),
        paymentStatus: getPaymentStatusFromSearch(searchParams),
        deliveryStatus: getDeliveryStatusFromSearch(searchParams),
        ...(from && to ? {from, to} : {})
    }
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

const buildOrderHandoffText = (order: AdminOrder, phone?: string | null) => {
    const clientName = order.client?.name || order.clientName || "Клиент не указан"
    const address = order.clientAddress?.address || "Адрес не указан"
    const payment = order.paymentMethod?.title || (order.paymentStatus ? paymentStatusMeta[order.paymentStatus].label : "Оплата не указана")
    const delivery = order.deliveryType?.title || (order.deliveryStatus ? deliveryStatusMeta[order.deliveryStatus].label : "Доставка не указана")
    const assignedEmployee = order.assignedEmployee
        ? `${order.assignedEmployee.firstName} ${order.assignedEmployee.lastName}`
        : "Не назначен"

    return [
        `Заказ #${order.orderNumber || order.id}`,
        `Клиент: ${clientName}`,
        `Телефон: ${phone || "Не указан"}`,
        `Адрес: ${address}`,
        `Следующий шаг: ${getNextActionLabel(order)}`,
        `Оплата: ${payment}`,
        `Доставка: ${delivery}`,
        `Ответственный: ${assignedEmployee}`,
        `Итого к оплате: ${formatMoney(order.total)}`
    ].join("\n")
}

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
        badges.push({label: "Оплачен + отменён", color: "volcano"})
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
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [filters, setFilters] = useState<GetAdminOrdersParams>(() => getInitialOrderFiltersFromSearch(searchParams))
    const [searchInput, setSearchInput] = useState("")
    const [problemOnly, setProblemOnly] = useState(searchParams.get("problemOnly") === "1")
    const [attentionOnly, setAttentionOnly] = useState(searchParams.get("attentionOnly") === "1")
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(() => getPositiveOrderIdFromSearch(searchParams))
    const [actionOrderId, setActionOrderId] = useState<number | null>(null)
    const [liveAlertsEnabled, setLiveAlertsEnabled] = useState(() => localStorage.getItem(LIVE_ALERT_STORAGE_KEY) !== "0")
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => (
        canUseBrowserNotifications() ? Notification.permission : "unsupported"
    ))
    const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<string | null>(null)
    const [refreshClock, setRefreshClock] = useState(() => dayjs())
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
    const {
        data: summary,
        isError: isSummaryError,
        isFetching: isSummaryFetching,
        refetch: refetchSummary
    } = useGetOrdersSummaryQuery(undefined, {
        pollingInterval: LIVE_ALERT_POLLING_INTERVAL_MS,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })
    const {
        data,
        isLoading,
        isFetching,
        isError: isOrdersError,
        refetch: refetchOrders
    } = useGetOrdersQuery({...filters, problemOnly, attentionOnly}, {
        pollingInterval: LIVE_ALERT_POLLING_INTERVAL_MS,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })
    const {
        data: selectedOrder,
        isFetching: isOrderLoading,
        isError: isOrderError,
        refetch: refetchSelectedOrder
    } = useGetOrderByIdQuery(selectedOrderId ?? 0, {
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
    const isOrderActionSaving = isUpdatingOrder || isUpdatingStatus || isCancelling || isCreatingComment
    const currentActionOrderId = actionOrderId ?? selectedOrderId
    const currentItems = useMemo(() => data?.items || [], [data?.items])
    const activeOrderFilterLabels = useMemo(() => {
        const labels: string[] = []

        if (filters.search) labels.push(`поиск: ${filters.search}`)
        if (filters.statusId) {
            labels.push(`статус: ${statuses?.find((status) => status.id === filters.statusId)?.title || filters.statusId}`)
        }
        if (filters.paymentStatus) labels.push(`оплата: ${paymentStatusMeta[filters.paymentStatus]?.label || filters.paymentStatus}`)
        if (filters.deliveryStatus) labels.push(`доставка: ${deliveryStatusMeta[filters.deliveryStatus]?.label || filters.deliveryStatus}`)
        if (filters.from && filters.to) labels.push(`период: ${dayjs(filters.from).format("DD.MM")}–${dayjs(filters.to).format("DD.MM")}`)
        if (problemOnly) labels.push("только проблемные")
        if (attentionOnly) labels.push("требуют внимания")

        return labels
    }, [attentionOnly, filters, problemOnly, statuses])
    const hasActiveOrderFilters = activeOrderFilterLabels.length > 0
    const editingOrder = useMemo(
        () => selectedOrder?.id === currentActionOrderId
            ? selectedOrder
            : currentItems.find((order) => order.id === currentActionOrderId),
        [currentActionOrderId, currentItems, selectedOrder]
    )
    const selectedOrderHistory = orderHistory || selectedOrder?.histories || []

    useEffect(() => {
        localStorage.setItem(LIVE_ALERT_STORAGE_KEY, liveAlertsEnabled ? "1" : "0")
    }, [liveAlertsEnabled])

    useEffect(() => {
        const orderIdFromUrl = getPositiveOrderIdFromSearch(searchParams)
        setSelectedOrderId((currentOrderId) => currentOrderId === orderIdFromUrl ? currentOrderId : orderIdFromUrl)
    }, [searchParams])

    useEffect(() => {
        setSearchParams((previousParams) => {
            const nextParams = new URLSearchParams()
            const orderId = getPositiveOrderIdFromSearch(previousParams) ?? selectedOrderId

            if (orderId) nextParams.set("orderId", String(orderId))
            if (filters.statusId) nextParams.set("statusId", String(filters.statusId))
            if (filters.paymentStatus) nextParams.set("paymentStatus", filters.paymentStatus)
            if (filters.deliveryStatus) nextParams.set("deliveryStatus", filters.deliveryStatus)
            if (filters.from && filters.to) {
                nextParams.set("from", filters.from)
                nextParams.set("to", filters.to)
            }
            if (problemOnly) nextParams.set("problemOnly", "1")
            if (attentionOnly) nextParams.set("attentionOnly", "1")

            return nextParams.toString() === previousParams.toString() ? previousParams : nextParams
        }, {replace: true})
    }, [attentionOnly, filters.deliveryStatus, filters.from, filters.paymentStatus, filters.statusId, filters.to, problemOnly, selectedOrderId, setSearchParams])

    useEffect(() => {
        const timer = window.setInterval(() => setRefreshClock(dayjs()), 15_000)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        if (!isFetching && (data || summary)) {
            setLastSuccessfulRefreshAt(dayjs().toISOString())
        }
    }, [data, isFetching, summary])

    const lastRefreshAgeSeconds = lastSuccessfulRefreshAt ? refreshClock.diff(dayjs(lastSuccessfulRefreshAt), "second") : null
    const isRefreshStale = lastRefreshAgeSeconds !== null && lastRefreshAgeSeconds * 1000 > STALE_REFRESH_WARNING_MS
    const isQueueActionBlocked = isOrdersError || isRefreshStale
    const queueActionBlockReason = isOrdersError
        ? "Очередь не обновилась — повторите загрузку перед изменением заказа."
        : "Данные очереди устарели — дождитесь успешного обновления перед изменением заказа."

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
            const permission = await Notification.requestPermission()
            setNotificationPermission(permission)
            if (permission === "denied") {
                message.warning("Desktop-уведомления запрещены в браузере — звуковой сигнал останется, но всплывающих уведомлений не будет.")
            }
        } else {
            setNotificationPermission(canUseBrowserNotifications() ? Notification.permission : "unsupported")
        }
        setLiveAlertsEnabled(enabled)
    }

    const findStatusByIntent = (intent: StatusIntent) => {
        const keywords = statusIntentKeywords[intent]
        return [...(statuses || [])]
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
            .find((status) => keywords.some((keyword) => status.title.toLowerCase().includes(keyword)))
    }

    const updateSelectedOrderId = (id: number | null) => {
        setSelectedOrderId(id)
        setSearchParams((previousParams) => {
            const nextParams = new URLSearchParams(previousParams)
            if (id) {
                nextParams.set("orderId", String(id))
            } else {
                nextParams.delete("orderId")
            }
            return nextParams
        }, {replace: !id})
    }

    const openOrder = (id: number) => updateSelectedOrderId(id)
    const closeOrderDrawer = () => updateSelectedOrderId(null)
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
        if (isUpdatingStatus) return
        setStatusModalOpen(false)
        setActionOrderId(null)
        statusForm.resetFields()
    }

    const closeCancelModal = () => {
        if (isCancelling) return
        setCancelModalOpen(false)
        setActionOrderId(null)
        cancelForm.resetFields()
    }

    const closeCommentModal = () => {
        if (isCreatingComment) return
        setCommentModalOpen(false)
        setActionOrderId(null)
        commentForm.resetFields()
    }

    const closeEditModal = () => {
        if (isUpdatingOrder) return
        setEditModalOpen(false)
        setActionOrderId(null)
        editForm.resetFields()
    }

    const setTodayFilters = () => {
        setProblemOnly(false)
        setAttentionOnly(false)
        setSearchInput("")
        setFilters(todayFilters())
    }
    const setAllFilters = () => {
        setProblemOnly(false)
        setAttentionOnly(false)
        setSearchInput("")
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

    const copyOrderHandoff = async (order: AdminOrder) => {
        try {
            await navigator.clipboard.writeText(buildOrderHandoffText(order, selectedPhone))
            message.success("Сводка для передачи скопирована")
        } catch {
            message.error("Не удалось скопировать сводку")
        }
    }

    const openClientProfile = (clientId: number) => {
        navigate(`/clients?clientId=${clientId}`)
    }

    const notificationPermissionMessage = notificationPermission === "granted"
        ? "Desktop-уведомления разрешены: браузер покажет короткий безопасный alert без ФИО и телефона."
        : notificationPermission === "denied"
            ? "Desktop-уведомления запрещены в браузере: оставляем только звук и обновление стола заказов."
            : notificationPermission === "unsupported"
                ? "Браузер не поддерживает desktop-уведомления: Live Ops Alert работает через звук и автообновление."
                : "Desktop-уведомления ещё не разрешены: при включении браузер попросит доступ."

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
            if (isAntdFormValidationError(error)) {
                return
            }
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
            if (isAntdFormValidationError(error)) {
                return
            }
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
            if (isAntdFormValidationError(error)) {
                return
            }
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
            if (isAntdFormValidationError(error)) {
                return
            }
            message.error(getNestErrorMessage(error))
        }
    }

    const orderColumns: ColumnsType<AdminOrder> = [
            {
                title: "Заказ",
                key: "orderNumber",
                width: 130,
                render: (_, order) => (
                    <Space direction="vertical" size={0}>
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
                        <Space direction="vertical" size={0}>
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
                        {order.paymentStatus && <Tag color={paymentStatusMeta[order.paymentStatus]?.color}>{paymentStatusMeta[order.paymentStatus]?.label}</Tag>}
                        {order.deliveryStatus && <Tag color={deliveryStatusMeta[order.deliveryStatus]?.color}>{deliveryStatusMeta[order.deliveryStatus]?.label}</Tag>}
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
                width: 320,
                fixed: "right",
                render: (_, order) => (
                    <Space wrap size={[6, 6]} className="order-row-actions">
                        <Button size="small" onClick={() => openOrder(order.id)}>Открыть</Button>
                        {canUpdateOrders && (
                            <Button
                                size="small"
                                type="primary"
                                disabled={isQueueActionBlocked || isOrderActionSaving}
                                title={isQueueActionBlocked ? queueActionBlockReason : isOrderActionSaving ? "Дождитесь завершения текущего действия" : undefined}
                                onClick={() => openNextActionModal(order)}
                            >
                                {getNextActionLabel(order)}
                            </Button>
                        )}
                        {canUpdateOrders && (
                            <Button
                                size="small"
                                disabled={isQueueActionBlocked || isOrderActionSaving}
                                title={isQueueActionBlocked ? queueActionBlockReason : isOrderActionSaving ? "Дождитесь завершения текущего действия" : undefined}
                                onClick={() => openEditModal(order)}
                            >
                                Правки
                            </Button>
                        )}
                        {canUpdateOrders && (
                            <Button
                                size="small"
                                disabled={isQueueActionBlocked || isOrderActionSaving}
                                title={isQueueActionBlocked ? queueActionBlockReason : isOrderActionSaving ? "Дождитесь завершения текущего действия" : undefined}
                                onClick={() => openStatusModal(order.id)}
                            >
                                Статус
                            </Button>
                        )}
                        {canDeleteOrders && (
                            <Button
                                size="small"
                                danger
                                disabled={isQueueActionBlocked || isOrderActionSaving}
                                title={isQueueActionBlocked ? queueActionBlockReason : isOrderActionSaving ? "Дождитесь завершения текущего действия" : undefined}
                                onClick={() => openCancelModal(order.id)}
                            >
                                Отмена
                            </Button>
                        )}
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
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <Card className="admin-hero-card orders-hero">
                <PageHeading
                    title="Today Order Desk"
                    subtitle="Операционный центр заказов: быстрые фильтры, красные риски и следующий шаг без чтения всей таблицы."
                />
                <Space wrap className="hero-badges">
                    <Badge status="processing" text="Сегодня по умолчанию" />
                    <Badge status={(summary?.problemToday ?? 0) > 0 ? "error" : isSummaryError ? "warning" : "success"} text={isSummaryError ? "Summary требует проверки" : `${summary?.problemToday ?? 0} проблемных`} />
                    <Badge status="warning" text="SLA: новые 10+ мин подсвечиваются" />
                    <Badge status={isFetching || isSummaryFetching ? "processing" : "success"} text="Live refresh: 30 сек" />
                    <Badge
                        status={lastSuccessfulRefreshAt ? "success" : "default"}
                        text={lastSuccessfulRefreshAt ? `Обновлено ${dayjs(lastSuccessfulRefreshAt).format("HH:mm:ss")}` : "Ожидаем первое обновление"}
                    />
                </Space>
            </Card>

            <Card className="filter-card">
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Space wrap align="center">
                        <Badge status={liveAlertsEnabled ? "processing" : "default"} text="Live Ops Alert" />
                        <Checkbox checked={liveAlertsEnabled} onChange={(event) => handleLiveAlertsChange(event.target.checked)}>
                            Звук и desktop-уведомления включены
                        </Checkbox>
                        <Typography.Text type="secondary">
                            Заказы и summary обновляются автоматически каждые 30 секунд. Последнее успешное обновление: {lastSuccessfulRefreshAt ? dayjs(lastSuccessfulRefreshAt).format("DD.MM HH:mm:ss") : "ещё не было"}.
                        </Typography.Text>
                        <Typography.Text type="secondary">
                            Уведомления не содержат ФИО или телефон клиента.
                        </Typography.Text>
                    </Space>
                    <Alert
                        showIcon
                        type={notificationPermission === "denied" ? "warning" : "info"}
                        message="Статус desktop-уведомлений"
                        description={notificationPermissionMessage}
                    />
                    {isRefreshStale && (
                        <Alert
                            showIcon
                            type="warning"
                            message="Данные давно не обновлялись"
                            description={`Последнее успешное обновление было ${lastRefreshAgeSeconds} сек. назад. Действия из таблицы временно заблокированы — дождитесь успешного refresh перед изменением заказа.`}
                        />
                    )}
                </Space>
            </Card>

            {isSummaryError && (
                <Alert
                    showIcon
                    type="warning"
                    message="Не удалось обновить операционный summary"
                    description="Счётчики Today Desk могут быть неполными. Перед оценкой нагрузки смены обновите summary; список заказов и карточки остаются доступными по отдельной загрузке."
                    action={<Button size="small" onClick={() => refetchSummary()}>Обновить summary</Button>}
                />
            )}

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
                <Space direction="vertical" size={14} style={{width: "100%"}}>
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
                            value={searchInput}
                            onChange={(event) => {
                                setSearchInput(event.target.value)
                                if (!event.target.value) setFilters((prev) => ({...prev, search: undefined, page: 1}))
                            }}
                            onSearch={(search) => setFilters((prev) => ({...prev, search: search.trim() || undefined, page: 1}))}
                            style={{width: 320}}
                        />
                        <Select
                            allowClear
                            placeholder="Статус заказа"
                            style={{width: 180}}
                            options={statuses?.map((status) => ({label: status.title, value: status.id}))}
                            value={filters.statusId}
                            onChange={(statusId) => setFilters((prev) => ({...prev, statusId, page: 1}))}
                        />
                        <Select
                            allowClear
                            placeholder="Статус оплаты"
                            style={{width: 180}}
                            options={paymentStatusOptions}
                            value={filters.paymentStatus}
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
                    <Space wrap align="center">
                        <Typography.Text type="secondary">
                            {hasActiveOrderFilters ? "Активные фильтры:" : "Фильтры не ограничивают список — показаны все доступные заказы."}
                        </Typography.Text>
                        {activeOrderFilterLabels.map((label) => <Tag key={label}>{label}</Tag>)}
                        {hasActiveOrderFilters && <Button size="small" onClick={setAllFilters}>Очистить всё</Button>}
                        {hasActiveOrderFilters && (
                            <Typography.Text type="secondary">
                                Ссылка сохраняет эти фильтры без клиентского поиска — можно безопасно передать очередь смены коллеге.
                            </Typography.Text>
                        )}
                    </Space>
                </Space>
            </Card>

            <Card
                className="admin-table-card orders-table-card"
                extra={(
                    <Typography.Text type="secondary">
                        {isFetching
                            ? "Обновляем список…"
                            : lastSuccessfulRefreshAt
                                ? `Данные актуальны на ${dayjs(lastSuccessfulRefreshAt).format("HH:mm:ss")}`
                                : "После загрузки здесь будет время актуальности"}
                    </Typography.Text>
                )}
            >
                {isOrdersError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось обновить очередь заказов"
                        description="Действия из таблицы временно заблокированы, чтобы менеджер не менял статус по устаревшему списку. Повторите загрузку или откройте карточку заказа только для просмотра."
                        action={<Button size="small" onClick={() => refetchOrders()}>Повторить</Button>}
                        style={{marginBottom: 16}}
                    />
                )}
                <Table<AdminOrder>
                    rowKey="id"
                    loading={isLoading}
                    dataSource={currentItems}
                    columns={orderColumns}
                    scroll={{x: 1600}}
                    rowClassName={(order) => getOrderBadges(order).some((badge) => badge.color === "red" || badge.color === "volcano") ? "table-row-alert" : ""}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={hasActiveOrderFilters
                                    ? "Заказов по выбранным условиям нет. Проверьте фильтры перед созданием ручного заказа или звонком клиенту."
                                    : "Заказы пока не поступали. Live Desk обновится автоматически при появлении новых заказов."
                                }
                            >
                                {hasActiveOrderFilters && <Button onClick={setAllFilters}>Показать все заказы</Button>}
                            </Empty>
                        )
                    }}
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
                onClose={closeOrderDrawer}
                width={1100}
                extra={selectedOrder && canUpdateOrders ? (
                    <Space wrap size={[6, 6]} className="order-drawer-actions">
                        <Button size="small" disabled={isOrderActionSaving} onClick={() => openEditModal(selectedOrder)}>Правки</Button>
                        <Button size="small" type="primary" disabled={isOrderActionSaving} onClick={() => openNextActionModal(selectedOrder)}>{getNextActionLabel(selectedOrder)}</Button>
                    </Space>
                ) : null}
            >
                {isOrderLoading && (
                    <Alert
                        type="info"
                        showIcon
                        message="Загружаем карточку заказа"
                        description="Подтягиваем состав, оплату, доставку и историю — не меняйте статус, пока данные не обновились."
                    />
                )}
                {!isOrderLoading && isOrderError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось открыть карточку заказа"
                        description="Повторите загрузку перед звонком клиенту или изменением статуса, чтобы не работать с неполными данными."
                        action={<Button size="small" onClick={() => refetchSelectedOrder()}>Повторить</Button>}
                    />
                )}
                {!isOrderLoading && !isOrderError && selectedOrderId && !selectedOrder && (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Заказ не найден или больше недоступен"
                    >
                        <Button onClick={closeOrderDrawer}>Вернуться к списку</Button>
                    </Empty>
                )}
                {!isOrderLoading && !isOrderError && selectedOrder && (
                    <Space direction="vertical" size={16} style={{width: "100%"}}>
                        <Card className="drawer-command-card">
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={8}>
                                    <Typography.Title level={4} style={{margin: 0}}>{selectedOrder.orderNumber || `#${selectedOrder.id}`}</Typography.Title>
                                    <Typography.Text type="secondary">Создан {dayjs(selectedOrder.createdAt).format("DD.MM.YYYY HH:mm")}</Typography.Text>
                                </Col>
                                <Col xs={24} md={10}>
                                    <Space wrap>
                                        {selectedOrder.status?.title && <Tag color="blue">{selectedOrder.status.title}</Tag>}
                                        {selectedOrder.paymentStatus && <Tag color={paymentStatusMeta[selectedOrder.paymentStatus]?.color}>{paymentStatusMeta[selectedOrder.paymentStatus]?.label}</Tag>}
                                        {selectedOrder.deliveryStatus && <Tag color={deliveryStatusMeta[selectedOrder.deliveryStatus]?.color}>{deliveryStatusMeta[selectedOrder.deliveryStatus]?.label}</Tag>}
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
                                <Space direction="vertical" size={16} style={{width: "100%"}}>
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
                                        {selectedOrderHistory.length ? (
                                            <Timeline
                                                items={selectedOrderHistory.map((item) => ({
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
                                        ) : (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="История пока пуста"
                                            >
                                                <Typography.Text type="secondary">
                                                    После смены статуса или комментария здесь появится журнал действий, чтобы менеджер видел контекст передачи заказа.
                                                </Typography.Text>
                                            </Empty>
                                        )}
                                    </Card>
                                </Space>
                            </Col>

                            <Col xs={24} lg={9}>
                                <Space direction="vertical" size={16} style={{width: "100%"}}>
                                    <Card className="next-action-card" title="Следующее действие">
                                        <Typography.Text strong>{getNextActionLabel(selectedOrder)}</Typography.Text>
                                        <div style={{marginTop: 12}}>
                                            <Space wrap>
                                                {canUpdateOrders && <Button type="primary" disabled={isOrderActionSaving} onClick={() => openNextActionModal(selectedOrder)}>{getNextActionLabel(selectedOrder)}</Button>}
                                                {canUpdateOrders && <Button disabled={isOrderActionSaving} onClick={() => openEditModal(selectedOrder)}>Операционные правки</Button>}
                                                {canUpdateOrders && <Button disabled={isOrderActionSaving} onClick={() => openStatusModal(selectedOrder.id)}>Другой статус</Button>}
                                                {selectedPhone && <Tooltip title="Скопировать телефон"><Button onClick={() => copyPhone(selectedPhone)}>Телефон</Button></Tooltip>}
                                                {canDeleteOrders && <Button danger disabled={isOrderActionSaving} onClick={() => openCancelModal(selectedOrder.id)}>Отменить</Button>}
                                            </Space>
                                        </div>
                                    </Card>

                                    <Card
                                        title="Сводка для передачи"
                                        extra={(
                                            <Tooltip title="Скопировать краткую сводку для чата, звонка или курьера">
                                                <Button icon={<CopyOutlined />} onClick={() => copyOrderHandoff(selectedOrder)}>Скопировать</Button>
                                            </Tooltip>
                                        )}
                                    >
                                        <Space direction="vertical" size={12} style={{width: "100%"}}>
                                            <Typography.Text type="secondary">
                                                Короткий чек-лист перед звонком клиенту, выдачей или передачей курьеру. Кнопка копирования берёт только безопасные операционные поля из карточки.
                                            </Typography.Text>
                                            <Descriptions bordered size="small" column={1}>
                                                <Descriptions.Item label="Следующий шаг">{getNextActionLabel(selectedOrder)}</Descriptions.Item>
                                                <Descriptions.Item label="Телефон">{selectedPhone || "Не указан"}</Descriptions.Item>
                                                <Descriptions.Item label="Адрес">{selectedOrder.clientAddress?.address || "Не указан"}</Descriptions.Item>
                                                <Descriptions.Item label="Оплата">
                                                    {selectedOrder.paymentMethod?.title || (selectedOrder.paymentStatus ? paymentStatusMeta[selectedOrder.paymentStatus].label : "Не указана")}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Доставка">
                                                    {selectedOrder.deliveryType?.title || (selectedOrder.deliveryStatus ? deliveryStatusMeta[selectedOrder.deliveryStatus].label : "Не указана")}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Ответственный">
                                                    {selectedOrder.assignedEmployee
                                                        ? `${selectedOrder.assignedEmployee.firstName} ${selectedOrder.assignedEmployee.lastName}`
                                                        : "Не назначен"}
                                                </Descriptions.Item>
                                            </Descriptions>
                                            {(!selectedPhone || (!selectedOrder.clientAddress?.address && selectedOrder.deliveryStatus !== "delivered")) && (
                                                <Alert
                                                    type="warning"
                                                    showIcon
                                                    message="Проверьте контактные данные перед передачей"
                                                    description="В заказе не хватает телефона или адреса. Лучше уточнить данные до смены статуса и передачи заказа дальше."
                                                />
                                            )}
                                        </Space>
                                    </Card>

                                    <Card title="CRM/клиентские операции">
                                        <Alert
                                            type="info"
                                            showIcon
                                            message={selectedOrder.client?.id ? "Можно открыть CRM-карточку клиента" : "CRM-карточка клиента недоступна"}
                                            description={selectedOrder.client?.id
                                                ? "Откройте профиль клиента, чтобы проверить историю заказов, адреса и бонусы перед звонком, блокировкой или спорной отменой. Из карточки заказа не выполняем рискованные CRM-операции напрямую."
                                                : "В карточке заказа нет безопасного clientId для перехода в CRM. Слияние дублей, редактирование адресной книги и история клиента остаются недоступны из заказа, чтобы не имитировать несуществующее поведение."
                                            }
                                        />
                                        <Space wrap style={{marginTop: 12}}>
                                            <Button disabled={!selectedOrder.client?.id} onClick={() => selectedOrder.client?.id && openClientProfile(selectedOrder.client.id)}>
                                                Открыть профиль клиента
                                            </Button>
                                            <Button disabled>Объединить дубль клиента</Button>
                                            <Button disabled>Редактировать адрес клиента</Button>
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
                                        <Descriptions.Item label="Товары до скидок">{formatMoney(selectedOrder.subtotal ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Скидка по позициям">{formatMoney(selectedOrder.discountTotal ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Промокод">{selectedOrder.promoCode || "—"}</Descriptions.Item>
                                        <Descriptions.Item label="Скидка по промокоду">{formatMoney(selectedOrder.promoDiscount ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Списано бонусов">{formatMoney(selectedOrder.bonusSpent ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Начислено бонусов">{formatMoney(selectedOrder.bonusEarned ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Доставка">{formatMoney(selectedOrder.deliveryPrice ?? 0)}</Descriptions.Item>
                                        <Descriptions.Item label="Итого к оплате"><Typography.Text strong>{formatMoney(selectedOrder.total)}</Typography.Text></Descriptions.Item>
                                        <Descriptions.Item label="Причина отмены">{selectedOrder.cancelReason || "—"}</Descriptions.Item>
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
                okText={isUpdatingOrder ? "Сохраняем…" : "Сохранить"}
                cancelButtonProps={{disabled: isUpdatingOrder}}
                maskClosable={!isUpdatingOrder}
                keyboard={!isUpdatingOrder}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
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
                            <InputNumber min={0} precision={0} style={{width: "100%"}} addonAfter="UZS" disabled={isUpdatingOrder} />
                        </Form.Item>
                        <Form.Item name="sourceId" label="Источник">
                            <Select
                                allowClear
                                disabled={isUpdatingOrder}
                                placeholder="Выберите источник"
                                options={sources?.map((source) => ({label: source.title, value: source.id}))}
                            />
                        </Form.Item>
                        <Form.Item name="assignedEmployeeId" label="Ответственный сотрудник">
                            <Select
                                allowClear
                                disabled={isUpdatingOrder}
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
                okText={isUpdatingStatus ? "Сохраняем…" : "Сохранить"}
                cancelButtonProps={{disabled: isUpdatingStatus}}
                maskClosable={!isUpdatingStatus}
                keyboard={!isUpdatingStatus}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Проверьте следующий шаг перед сменой статуса"
                        description={editingOrder ? `Заказ ${editingOrder.orderNumber || `#${editingOrder.id}`}: ${getNextActionLabel(editingOrder)}. Клиенту показывайте только понятный и безопасный комментарий.` : "Смена статуса влияет на очередь Today Order Desk и может быть видна клиенту."}
                    />
                    <Form form={statusForm} layout="vertical">
                        <Form.Item name="statusId" label="Новый статус" rules={[{required: true, message: "Выберите статус"}]}>
                            <Select disabled={isUpdatingStatus} options={statuses?.map((status) => ({label: status.title, value: status.id}))} />
                        </Form.Item>
                        <Form.Item name="comment" label="Комментарий">
                            <Input.TextArea rows={3} disabled={isUpdatingStatus} placeholder="Например: согласовано с клиентом, передано на сборку" />
                        </Form.Item>
                        <Form.Item name="visibleForClient" valuePropName="checked">
                            <Checkbox disabled={isUpdatingStatus}>Показывать клиенту</Checkbox>
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>

            <Modal
                title="Отмена заказа"
                open={isCancelModalOpen}
                onCancel={closeCancelModal}
                onOk={handleCancelSubmit}
                confirmLoading={isCancelling}
                okText={isCancelling ? "Отменяем…" : "Отменить заказ"}
                cancelButtonProps={{disabled: isCancelling}}
                maskClosable={!isCancelling}
                keyboard={!isCancelling}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type={editingOrder?.paymentStatus === "paid" ? "warning" : "info"}
                        showIcon
                        message={editingOrder?.paymentStatus === "paid" ? "Заказ оплачен — проверьте возврат" : "Отмена влияет на операционную очередь"}
                        description="Перед отменой укажите причину: она поможет поддержке, курьеру и следующему менеджеру быстро понять контекст. Возвраты и клиентские коммуникации выполняйте по внутреннему процессу."
                    />
                    <Form form={cancelForm} layout="vertical">
                        <Form.Item name="reason" label="Причина отмены" rules={[{required: true, message: "Укажите причину отмены"}]}>
                            <Input.TextArea rows={3} disabled={isCancelling} placeholder="Например: клиент отказался, нет товара, дубль заказа" />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>

            <Modal
                title="Комментарий к заказу"
                open={isCommentModalOpen}
                onCancel={closeCommentModal}
                onOk={handleCommentSubmit}
                confirmLoading={isCreatingComment}
                okText={isCreatingComment ? "Добавляем…" : "Добавить"}
                cancelButtonProps={{disabled: isCreatingComment}}
                maskClosable={!isCreatingComment}
                keyboard={!isCreatingComment}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Фиксируйте только полезный операционный контекст"
                        description="Комментарий попадёт в историю заказа. Если он виден клиенту, избегайте внутренних пометок, персональных данных сотрудников и технических сокращений."
                    />
                    <Form form={commentForm} layout="vertical">
                        <Form.Item name="message" label="Комментарий" rules={[{required: true, message: "Введите комментарий"}]}>
                            <Input.TextArea rows={4} disabled={isCreatingComment} placeholder="Например: клиент подтвердил адрес, передано курьеру, нужен повторный звонок" />
                        </Form.Item>
                        <Form.Item name="visibleForClient" valuePropName="checked">
                            <Checkbox disabled={isCreatingComment}>Показывать клиенту</Checkbox>
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </Space>
    )
}

export default OrdersPage
