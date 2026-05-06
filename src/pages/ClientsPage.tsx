import {Button, Card, Descriptions, Drawer, Form, Input, Modal, Space, Table, Tabs, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useState} from "react"
import PageHeading from "../components/PageHeading.tsx"
import type {AdminClient, AdminClientBonusTransaction, AdminClientOrder} from "../features/clients/clientTypes.ts"
import {
    useBlockClientMutation,
    useGetClientAddressesQuery,
    useGetClientBonusTransactionsQuery,
    useGetClientByIdQuery,
    useGetClientOrdersQuery,
    useGetClientsQuery,
    useUnblockClientMutation,
    useUpdateClientMutation
} from "../features/clients/clientApi.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {formatMoney} from "../utils/formatters.ts"
import {useCan} from "../features/auth/permissions.ts"
import dayjs from "dayjs"

const ClientsPage = () => {
    const [filters, setFilters] = useState<{search?: string; page: number; pageSize: number}>({
        search: "",
        page: 1,
        pageSize: 20
    })
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
    const [editingClientId, setEditingClientId] = useState<number | null>(null)
    const [isEditModalOpen, setEditModalOpen] = useState(false)
    const [editForm] = Form.useForm<{name?: string; phone?: string}>()

    const {data, isLoading} = useGetClientsQuery({
        search: filters.search || undefined,
        page: filters.page,
        pageSize: filters.pageSize
    })
    const {data: clientDetails, isFetching: isClientLoading} = useGetClientByIdQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {data: clientOrders, isFetching: isClientOrdersLoading} = useGetClientOrdersQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {data: clientAddresses, isFetching: isClientAddressesLoading} = useGetClientAddressesQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {data: clientBonusTransactions, isFetching: isClientBonusLoading} = useGetClientBonusTransactionsQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const [blockClient] = useBlockClientMutation()
    const [unblockClient] = useUnblockClientMutation()
    const [updateClient, {isLoading: isUpdating}] = useUpdateClientMutation()
    const canUpdateClients = useCan("clients.update")
    const canDeleteClients = useCan("clients.delete")

    const handleBlockToggle = async (client: AdminClient) => {
        try {
            if (client.isActive) {
                await blockClient(client.id).unwrap()
                message.success("Клиент заблокирован")
            } else {
                await unblockClient(client.id).unwrap()
                message.success("Клиент разблокирован")
            }
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const openEdit = (client: AdminClient) => {
        editForm.setFieldsValue({name: client.name, phone: client.phone})
        setEditingClientId(client.id)
        setEditModalOpen(true)
    }

    const closeEdit = () => {
        setEditingClientId(null)
        setEditModalOpen(false)
        editForm.resetFields()
    }

    const saveEdit = async () => {
        if (!editingClientId) return
        try {
            const values = await editForm.validateFields()
            await updateClient({id: editingClientId, body: values}).unwrap()
            message.success("Клиент обновлён")
            closeEdit()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const orderColumns: ColumnsType<AdminClientOrder> = [
        {title: "Заказ", key: "order", render: (_, order) => order.orderNumber || `#${order.id}`},
        {title: "Дата", dataIndex: "createdAt", width: 120, render: (value?: string) => (value ? dayjs(value).format("DD.MM") : "—")},
        {title: "Сумма", dataIndex: "total", width: 120, render: (value?: number) => formatMoney(value || 0)},
        {title: "Статус", key: "status", width: 180, render: (_, order) => (
            <Space wrap size={[4, 4]}>
                {order.status?.title && <Tag color="blue">{order.status.title}</Tag>}
                {order.paymentStatus && <Tag>{order.paymentStatus}</Tag>}
                {order.deliveryStatus && <Tag>{order.deliveryStatus}</Tag>}
            </Space>
        )}
    ]

    const bonusColumns: ColumnsType<AdminClientBonusTransaction> = [
        {title: "Дата", dataIndex: "createdAt", width: 130, render: (value?: string) => (value ? dayjs(value).format("DD.MM HH:mm") : "—")},
        {title: "Тип", dataIndex: "type", width: 120, render: (value?: string) => <Tag>{value || "—"}</Tag>},
        {title: "Сумма", dataIndex: "amount", width: 120},
        {title: "Комментарий", dataIndex: "comment", render: (value?: string) => value || "—"}
    ]

    const columns: ColumnsType<AdminClient> = [
        {title: "ID", dataIndex: "id", width: 80},
        {title: "Имя", dataIndex: "name"},
        {title: "Телефон", dataIndex: "phone"},
        {
            title: "Статус",
            dataIndex: "isActive",
            width: 140,
            render: (isActive: boolean) =>
                isActive ? <Tag color="green">Активен</Tag> : <Tag color="red">Заблокирован</Tag>
        },
        {
            title: "Заказы",
            key: "ordersCount",
            width: 100,
            render: (_, client) => client.ordersCount ?? "—"
        },
        {
            title: "Сумма покупок",
            key: "totalSpent",
            width: 140,
            render: (_, client) => formatMoney(client.totalSpent)
        },
        {
            title: "Действия",
            key: "actions",
            width: 280,
            render: (_, client) => (
                <Space>
                    <Button onClick={() => setSelectedClientId(client.id)}>Открыть</Button>
                    {canUpdateClients && <Button onClick={() => openEdit(client)}>Редактировать</Button>}
                    {canDeleteClients && (
                        <Button danger={client.isActive} onClick={() => handleBlockToggle(client)}>
                            {client.isActive ? "Блок" : "Разблок"}
                        </Button>
                    )}
                </Space>
            )
        }
    ]

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading title="Клиенты" subtitle="Список клиентов, статусы и профиль." />

            <Card>
                <Input.Search
                    placeholder="Поиск по имени или телефону"
                    allowClear
                    onSearch={(search) => setFilters((prev) => ({...prev, search, page: 1}))}
                    style={{maxWidth: 360}}
                />
            </Card>

            <Card>
                <Table<AdminClient>
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={data?.items || []}
                    pagination={{
                        current: data?.page || filters.page,
                        pageSize: data?.pageSize || filters.pageSize,
                        total: data?.total || 0,
                        onChange: (page, pageSize) => setFilters((prev) => ({...prev, page, pageSize}))
                    }}
                />
            </Card>

            <Drawer
                title={clientDetails ? `Клиент #${clientDetails.id}` : "Карточка клиента"}
                width={760}
                open={Boolean(selectedClientId)}
                onClose={() => setSelectedClientId(null)}
            >
                {isClientLoading && <Typography.Text type="secondary">Загрузка...</Typography.Text>}
                {!isClientLoading && clientDetails && (
                    <Space orientation="vertical" size={16} style={{width: "100%"}}>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Имя">{clientDetails.name || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Телефон">
                                <Typography.Text copyable={Boolean(clientDetails.phone)}>{clientDetails.phone || "—"}</Typography.Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Статус">
                                {clientDetails.isActive ? <Tag color="green">Активен</Tag> : <Tag color="red">Заблокирован</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Бонусы">{clientDetails.bonusBalance ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Заказы">{clientDetails.stats?.ordersCount ?? clientDetails.ordersCount ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Сумма покупок">{formatMoney(clientDetails.stats?.totalSpent ?? clientDetails.totalSpent ?? 0)}</Descriptions.Item>
                            <Descriptions.Item label="Средний чек">{formatMoney(clientDetails.stats?.averageOrderValue ?? clientDetails.averageCheck ?? 0)}</Descriptions.Item>
                            <Descriptions.Item label="Последний заказ">
                                {clientDetails.stats?.lastOrderAt || clientDetails.lastOrderAt
                                    ? dayjs(clientDetails.stats?.lastOrderAt || clientDetails.lastOrderAt).format("DD.MM.YYYY HH:mm")
                                    : "—"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Tabs
                            items={[
                                {
                                    key: "orders",
                                    label: `Заказы (${clientOrders?.total ?? 0})`,
                                    children: (
                                        <Table<AdminClientOrder>
                                            rowKey="id"
                                            loading={isClientOrdersLoading}
                                            columns={orderColumns}
                                            dataSource={clientOrders?.items || []}
                                            pagination={false}
                                            size="small"
                                        />
                                    )
                                },
                                {
                                    key: "addresses",
                                    label: `Адреса (${clientAddresses?.length ?? 0})`,
                                    children: (
                                        <Table
                                            rowKey="id"
                                            loading={isClientAddressesLoading}
                                            dataSource={clientAddresses || []}
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                {title: "Адрес", dataIndex: "address", render: (value?: string) => value || "—"}
                                            ]}
                                        />
                                    )
                                },
                                {
                                    key: "bonuses",
                                    label: `Бонусы (${clientBonusTransactions?.length ?? 0})`,
                                    children: (
                                        <Table<AdminClientBonusTransaction>
                                            rowKey="id"
                                            loading={isClientBonusLoading}
                                            columns={bonusColumns}
                                            dataSource={clientBonusTransactions || []}
                                            pagination={false}
                                            size="small"
                                        />
                                    )
                                }
                            ]}
                        />
                    </Space>
                )}
            </Drawer>

            <Modal
                title="Редактировать клиента"
                open={isEditModalOpen}
                onCancel={closeEdit}
                onOk={saveEdit}
                confirmLoading={isUpdating}
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="name" label="Имя">
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Телефон">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default ClientsPage
