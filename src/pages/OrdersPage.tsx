import {Button, Card, Descriptions, Drawer, Space, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {useGetOrderByIdQuery, useGetOrdersQuery} from "../features/orders/orderApi.ts"
import type {AdminOrder, OrderItem} from "../features/orders/OrderTypes.ts"

const OrdersPage = () => {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

    const {data, isLoading} = useGetOrdersQuery(
        {page, pageSize},
        {refetchOnMountOrArgChange: true}
    )
    const {data: selectedOrder, isFetching: isOrderLoading} = useGetOrderByIdQuery(selectedOrderId ?? 0, {
        skip: !selectedOrderId
    })

    const orderColumns: ColumnsType<AdminOrder> = useMemo(
        () => [
            {
                title: "Заказ",
                dataIndex: "id",
                width: 90,
                render: (id: number) => `#${id}`
            },
            {
                title: "Дата",
                dataIndex: "createdAt",
                width: 180,
                render: (value: string) => dayjs(value).format("DD.MM.YYYY HH:mm")
            },
            {
                title: "Клиент",
                key: "client",
                render: (_, record) => (
                    <div>
                        <div>{record.client?.name || record.clientName || "—"}</div>
                        <Typography.Text type="secondary">
                            {record.client?.phone || record.phone || "—"}
                        </Typography.Text>
                    </div>
                )
            },
            {
                title: "Статус",
                dataIndex: "status",
                width: 150,
                render: (status: AdminOrder["status"]) => status ? <Tag color="blue">{status.title}</Tag> : "—"
            },
            {
                title: "Сумма",
                dataIndex: "total",
                width: 160,
                render: (value: number) => `${value.toLocaleString()} сум`
            },
            {
                title: "Позиции",
                key: "itemsCount",
                width: 110,
                render: (_, record) => record.items.length
            },
            {
                title: "Действия",
                key: "actions",
                width: 130,
                render: (_, record) => (
                    <Button onClick={() => setSelectedOrderId(record.id)}>
                        Подробнее
                    </Button>
                )
            }
        ],
        []
    )

    const itemColumns: ColumnsType<OrderItem> = [
        {title: "ID", dataIndex: "id", width: 70},
        {
            title: "Вариант",
            key: "variant",
            render: (_, item) => item.productVariant?.title || "—"
        },
        {
            title: "Описание",
            key: "description",
            render: (_, item) => item.productVariant?.description || "—"
        },
        {title: "Размер", key: "size", render: (_, item) => item.size?.title || "—"},
        {title: "Qty", dataIndex: "qty", width: 80},
        {
            title: "Цена",
            dataIndex: "price",
            width: 130,
            render: (value: number) => `${value.toLocaleString()} сум`
        },
        {
            title: "Скидка",
            dataIndex: "discount",
            width: 90
        }
    ]

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Заказы"
                subtitle="Актуальный список заказов из /api/admin/orders."
            />

            <Card>
                <Table<AdminOrder>
                    rowKey="id"
                    loading={isLoading}
                    dataSource={data?.items || []}
                    columns={orderColumns}
                    pagination={{
                        current: page,
                        pageSize,
                        total: data?.total || 0,
                        onChange: (nextPage, nextPageSize) => {
                            setPage(nextPage)
                            setPageSize(nextPageSize)
                        }
                    }}
                />
            </Card>

            <Drawer
                title={selectedOrder ? `Заказ #${selectedOrder.id}` : "Детали заказа"}
                width={860}
                open={Boolean(selectedOrderId)}
                onClose={() => setSelectedOrderId(null)}
            >
                {isOrderLoading && <Typography.Text type="secondary">Загрузка...</Typography.Text>}
                {!isOrderLoading && selectedOrder && (
                    <Space direction="vertical" size={16} style={{width: "100%"}}>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Дата">
                                {dayjs(selectedOrder.createdAt).format("DD.MM.YYYY HH:mm")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Статус">
                                {selectedOrder.status?.title || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Клиент">
                                {selectedOrder.client?.name || selectedOrder.clientName || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Телефон">
                                {selectedOrder.client?.phone || selectedOrder.phone || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Адрес" span={2}>
                                {selectedOrder.clientAddress?.address || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Комментарий" span={2}>
                                {selectedOrder.comment || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Сумма">
                                {selectedOrder.total.toLocaleString()} сум
                            </Descriptions.Item>
                            <Descriptions.Item label="Источник">
                                {selectedOrder.source?.title || "—"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Card title="Позиции заказа">
                            <Table<OrderItem>
                                rowKey="id"
                                dataSource={selectedOrder.items || []}
                                columns={itemColumns}
                                pagination={false}
                            />
                        </Card>
                    </Space>
                )}
            </Drawer>
        </Space>
    )
}

export default OrdersPage
