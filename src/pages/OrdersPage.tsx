import {
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
import {useMemo, useState} from "react"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {
    useCancelOrderMutation,
    useCreateOrderCommentMutation,
    useGetOrderByIdQuery,
    useGetOrderHistoryQuery,
    useGetOrdersQuery,
    useGetOrdersSummaryQuery,
    useUpdateOrderStatusMutation
} from "../features/orders/orderApi.ts"
import type {
    AdminOrder,
    GetAdminOrdersParams,
    OrderDeliveryStatus,
    OrderHistoryItem,
    OrderItem,
    OrderPaymentStatus
} from "../features/orders/OrderTypes.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {useGetOrderStatusesQuery} from "../features/order-status/orderStatusApi.ts"
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

const getOrderBadges = (order: AdminOrder) => {
    const badges: Array<{label: string; color: string}> = []
    const age = getOrderAgeMinutes(order.createdAt)

    if (order.deliveryStatus === "pending") badges.push({label: "Новый", color: "orange"})
    if (order.paymentStatus === "paid") badges.push({label: "Оплачен", color: "green"})
    if (order.paymentStatus === "pending") badges.push({label: "Ждёт оплату", color: "gold"})
    if (order.deliveryStatus === "pending" && age >= 10) badges.push({label: "Ждёт 10+ мин", color: "red"})
    if (order.deliveryStatus === "ready") badges.push({label: "Готов", color: "cyan"})
    if (order.deliveryStatus === "cancelled" && order.paymentStatus === "paid") {
        badges.push({label: "Paid + Cancelled", color: "volcano"})
    }

    return badges
}

const getHistoryDate = (item: OrderHistoryItem) => item.changedAt || item.createdAt
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
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
    const [actionOrderId, setActionOrderId] = useState<number | null>(null)

    const [isStatusModalOpen, setStatusModalOpen] = useState(false)
    const [isCancelModalOpen, setCancelModalOpen] = useState(false)
    const [isCommentModalOpen, setCommentModalOpen] = useState(false)
    const [statusForm] = Form.useForm<{statusId: number; comment?: string; visibleForClient?: boolean}>()
    const [cancelForm] = Form.useForm<{reason?: string}>()
    const [commentForm] = Form.useForm<{message: string; visibleForClient?: boolean}>()

    const {data: statuses} = useGetOrderStatusesQuery()
    const {data: summary} = useGetOrdersSummaryQuery(undefined, {refetchOnMountOrArgChange: true})
    const {data, isLoading} = useGetOrdersQuery({...filters, problemOnly}, {refetchOnMountOrArgChange: true})
    const {data: selectedOrder, isFetching: isOrderLoading} = useGetOrderByIdQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const {data: orderHistory} = useGetOrderHistoryQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const [updateOrderStatus, {isLoading: isUpdatingStatus}] = useUpdateOrderStatusMutation()
    const [cancelOrder, {isLoading: isCancelling}] = useCancelOrderMutation()
    const [createOrderComment, {isLoading: isCreatingComment}] = useCreateOrderCommentMutation()
    const canUpdateOrders = useCan("orders.update")
    const canDeleteOrders = useCan("orders.delete")
    const currentItems = data?.items || []

    const findStatusByIntent = (intent: StatusIntent) => {
        const keywords = statusIntentKeywords[intent]
        return [...(statuses || [])]
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
            .find((status) => keywords.some((keyword) => status.title.toLowerCase().includes(keyword)))
    }

    const openOrder = (id: number) => setSelectedOrderId(id)
    const currentActionOrderId = actionOrderId ?? selectedOrderId
    const selectedPhone = selectedOrder?.client?.phone || selectedOrder?.phone

    const openStatusModal = (id: number) => {
        setActionOrderId(id)
        setStatusModalOpen(true)
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

    const setTodayFilters = () => {
        setProblemOnly(false)
        setFilters(todayFilters())
    }
    const setAllFilters = () => {
        setProblemOnly(false)
        setFilters({page: 1, pageSize: 20})
    }
    const setDeliveryFilter = (deliveryStatus?: OrderDeliveryStatus) => {
        setProblemOnly(false)
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

    const orderColumns: ColumnsType<AdminOrder> = useMemo(
        () => [
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
                title: "Возраст",
                key: "age",
                width: 120,
                render: (_, order) => (
                    <Tag color={getOrderAgeMinutes(order.createdAt) >= 10 && order.deliveryStatus === "pending" ? "red" : "default"}>
                        {formatOrderAge(order.createdAt)}
                    </Tag>
                )
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
                        {canUpdateOrders && <Button onClick={() => openStatusModal(order.id)}>Статус</Button>}
                        {canDeleteOrders && <Button danger onClick={() => openCancelModal(order.id)}>Отмена</Button>}
                    </Space>
                )
            }
        ],
        [canDeleteOrders, canUpdateOrders]
    )

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
                            setProblemOnly((prev) => !prev)
                            setFilters((prev) => ({...prev, page: 1}))
                        }}>Проблемные</Button>
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
                extra={selectedOrder && canUpdateOrders ? <Button type="primary" onClick={() => openNextActionModal(selectedOrder)}>{getNextActionLabel(selectedOrder)}</Button> : null}
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
                                                {canUpdateOrders && <Button onClick={() => openStatusModal(selectedOrder.id)}>Другой статус</Button>}
                                                {selectedPhone && <Tooltip title="Скопировать телефон"><Button onClick={() => copyPhone(selectedPhone)}>Телефон</Button></Tooltip>}
                                                {canDeleteOrders && <Button danger onClick={() => openCancelModal(selectedOrder.id)}>Отменить</Button>}
                                            </Space>
                                        </div>
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
