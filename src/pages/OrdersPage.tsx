import {
    Button,
    Card,
    Checkbox,
    DatePicker,
    Descriptions,
    Drawer,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Timeline,
    Typography,
    message
} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {
    useCancelOrderMutation,
    useCreateOrderCommentMutation,
    useGetOrderByIdQuery,
    useGetOrderHistoryQuery,
    useGetOrdersQuery,
    useUpdateOrderStatusMutation
} from "../features/orders/orderApi.ts"
import type {
    AdminOrder,
    GetAdminOrdersParams,
    OrderDeliveryStatus,
    OrderItem,
    OrderPaymentStatus
} from "../features/orders/OrderTypes.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {useGetOrderStatusesQuery} from "../features/order-status/orderStatusApi.ts"
import {formatMoney} from "../utils/formatters.ts"

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

const OrdersPage = () => {
    const [filters, setFilters] = useState<GetAdminOrdersParams>({page: 1, pageSize: 20})
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
    const [actionOrderId, setActionOrderId] = useState<number | null>(null)

    const [isStatusModalOpen, setStatusModalOpen] = useState(false)
    const [isCancelModalOpen, setCancelModalOpen] = useState(false)
    const [isCommentModalOpen, setCommentModalOpen] = useState(false)
    const [statusForm] = Form.useForm<{statusId: number; comment?: string; visibleForClient?: boolean}>()
    const [cancelForm] = Form.useForm<{reason?: string}>()
    const [commentForm] = Form.useForm<{message: string; visibleForClient?: boolean}>()

    const {data: statuses} = useGetOrderStatusesQuery()
    const {data, isLoading} = useGetOrdersQuery(filters, {refetchOnMountOrArgChange: true})
    const {data: selectedOrder, isFetching: isOrderLoading} = useGetOrderByIdQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const {data: orderHistory} = useGetOrderHistoryQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })
    const [updateOrderStatus, {isLoading: isUpdatingStatus}] = useUpdateOrderStatusMutation()
    const [cancelOrder, {isLoading: isCancelling}] = useCancelOrderMutation()
    const [createOrderComment, {isLoading: isCreatingComment}] = useCreateOrderCommentMutation()

    const openOrder = (id: number) => setSelectedOrderId(id)
    const currentActionOrderId = actionOrderId ?? selectedOrderId

    const openStatusModal = (id: number) => {
        setActionOrderId(id)
        setStatusModalOpen(true)
    }

    const openCancelModal = (id: number) => {
        setActionOrderId(id)
        setCancelModalOpen(true)
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
                title: "№",
                key: "orderNumber",
                width: 100,
                render: (_, order) => order.orderNumber || `#${order.id}`
            },
            {
                title: "Дата",
                dataIndex: "createdAt",
                width: 170,
                render: (value: string) => dayjs(value).format("DD.MM.YYYY HH:mm")
            },
            {
                title: "Клиент",
                key: "client",
                render: (_, order) => (
                    <div>
                        <div>{order.client?.name || order.clientName || "—"}</div>
                        <Typography.Text type="secondary">{order.client?.phone || order.phone || "—"}</Typography.Text>
                    </div>
                )
            },
            {
                title: "Сумма",
                dataIndex: "total",
                width: 150,
                render: (total: number) => formatMoney(total)
            },
            {
                title: "Статус заказа",
                key: "status",
                width: 150,
                render: (_, order) => order.status?.title ? <Tag color="blue">{order.status.title}</Tag> : "—"
            },
            {
                title: "Оплата",
                key: "paymentStatus",
                width: 130,
                render: (_, order) => {
                    const value = order.paymentStatus
                    if (!value) return "—"
                    const color = value === "paid" ? "green" : value === "failed" ? "red" : "orange"
                    return <Tag color={color}>{value}</Tag>
                }
            },
            {
                title: "Доставка",
                key: "deliveryStatus",
                width: 140,
                render: (_, order) => order.deliveryStatus ? <Tag>{order.deliveryStatus}</Tag> : "—"
            },
            {
                title: "Источник",
                key: "source",
                width: 130,
                render: (_, order) => order.source?.title || "—"
            },
            {
                title: "Сотрудник",
                key: "employee",
                width: 160,
                render: (_, order) =>
                    order.assignedEmployee
                        ? `${order.assignedEmployee.firstName} ${order.assignedEmployee.lastName}`
                        : "—"
            },
            {
                title: "Товары",
                key: "items",
                width: 90,
                render: (_, order) => order.items?.length ?? 0
            },
            {
                title: "Действия",
                key: "actions",
                width: 260,
                render: (_, order) => (
                    <Space>
                        <Button onClick={() => openOrder(order.id)}>Открыть</Button>
                        <Button onClick={() => openStatusModal(order.id)}>Статус</Button>
                        <Button danger onClick={() => openCancelModal(order.id)}>Отмена</Button>
                    </Space>
                )
            }
        ],
        []
    )

    const itemColumns: ColumnsType<OrderItem> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Товар", key: "variant", render: (_, item) => item.productVariant?.title || "—"},
        {title: "Описание", key: "description", render: (_, item) => item.productVariant?.description || "—"},
        {title: "Размер", key: "size", render: (_, item) => item.size?.title || "—"},
        {title: "Qty", dataIndex: "qty", width: 80},
        {title: "Цена", dataIndex: "price", width: 130, render: (value: number) => formatMoney(value)},
        {title: "Discount", dataIndex: "discount", width: 100},
        {title: "Promotion", dataIndex: "promotion", width: 110, render: (value: boolean) => (value ? "Yes" : "No")}
    ]

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading title="Заказы" subtitle="Управление жизненным циклом заказов." />

            <Card>
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
                        onChange={(deliveryStatus) => setFilters((prev) => ({...prev, deliveryStatus, page: 1}))}
                    />
                    <DatePicker.RangePicker
                        onChange={(dates) => {
                            setFilters((prev) => ({
                                ...prev,
                                from: dates?.[0]?.format("YYYY-MM-DD"),
                                to: dates?.[1]?.format("YYYY-MM-DD"),
                                page: 1
                            }))
                        }}
                    />
                    <Button onClick={() => setFilters({page: 1, pageSize: 20})}>Сброс</Button>
                </Space>
            </Card>

            <Card>
                <Table<AdminOrder>
                    rowKey="id"
                    loading={isLoading}
                    dataSource={data?.items || []}
                    columns={orderColumns}
                    scroll={{x: 1300}}
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
                width={980}
            >
                {isOrderLoading && <Typography.Text type="secondary">Загрузка...</Typography.Text>}
                {!isOrderLoading && selectedOrder && (
                    <Space orientation="vertical" size={16} style={{width: "100%"}}>
                        <Descriptions title="Шапка заказа" bordered size="small" column={2}>
                            <Descriptions.Item label="Номер">{selectedOrder.orderNumber || selectedOrder.id}</Descriptions.Item>
                            <Descriptions.Item label="Статус">{selectedOrder.status?.title || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Создан">{dayjs(selectedOrder.createdAt).format("DD.MM.YYYY HH:mm")}</Descriptions.Item>
                            <Descriptions.Item label="Обновлён">{selectedOrder.updatedAt ? dayjs(selectedOrder.updatedAt).format("DD.MM.YYYY HH:mm") : "—"}</Descriptions.Item>
                            <Descriptions.Item label="Оплата">{selectedOrder.paymentStatus || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Доставка">{selectedOrder.deliveryStatus || "—"}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Клиент и доставка" bordered size="small" column={2}>
                            <Descriptions.Item label="Клиент">{selectedOrder.client?.name || selectedOrder.clientName || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Телефон">{selectedOrder.client?.phone || selectedOrder.phone || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Адрес" span={2}>{selectedOrder.clientAddress?.address || "—"}</Descriptions.Item>
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

                        <Descriptions title="Суммы" bordered size="small" column={3}>
                            <Descriptions.Item label="Subtotal">{selectedOrder.subtotal ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Discount">{selectedOrder.discountTotal ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Promo">{selectedOrder.promoCode || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Promo discount">{selectedOrder.promoDiscount ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Bonus spent">{selectedOrder.bonusSpent ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Bonus earned">{selectedOrder.bonusEarned ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Delivery">{selectedOrder.deliveryPrice ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Total">{selectedOrder.total}</Descriptions.Item>
                            <Descriptions.Item label="Cancel reason">{selectedOrder.cancelReason || "—"}</Descriptions.Item>
                        </Descriptions>

                        <Card title="Товары">
                            <Table<OrderItem>
                                rowKey="id"
                                columns={itemColumns}
                                dataSource={selectedOrder.items || []}
                                pagination={false}
                                scroll={{x: 1000}}
                            />
                        </Card>

                        <Card
                            title="История статусов"
                            extra={<Button onClick={() => setCommentModalOpen(true)}>Добавить комментарий</Button>}
                        >
                            <Timeline
                                items={(orderHistory || selectedOrder.histories || []).map((item) => ({
                                    children: (
                                        <div>
                                            <Typography.Text>{dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}</Typography.Text>
                                            <div>from: {item.fromStatusId ?? "—"} → to: {item.toStatusId ?? "—"}</div>
                                            {item.comment && <Typography.Text type="secondary">{item.comment}</Typography.Text>}
                                        </div>
                                    )
                                }))}
                            />
                        </Card>
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
                    <Form.Item name="reason" label="Причина отмены">
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
