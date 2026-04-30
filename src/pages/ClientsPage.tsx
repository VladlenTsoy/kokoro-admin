import {Button, Card, Descriptions, Drawer, Form, Input, Modal, Space, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useState} from "react"
import PageHeading from "../components/PageHeading.tsx"
import type {AdminClient} from "../features/clients/clientTypes.ts"
import {
    useBlockClientMutation,
    useGetClientByIdQuery,
    useGetClientsQuery,
    useUnblockClientMutation,
    useUpdateClientMutation
} from "../features/clients/clientApi.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {formatMoney} from "../utils/formatters.ts"
import {useCan} from "../features/auth/permissions.ts"

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
                            <Descriptions.Item label="Имя">{clientDetails.name}</Descriptions.Item>
                            <Descriptions.Item label="Телефон">{clientDetails.phone}</Descriptions.Item>
                            <Descriptions.Item label="Статус">
                                {clientDetails.isActive ? <Tag color="green">Активен</Tag> : <Tag color="red">Заблокирован</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Бонусы">{clientDetails.bonusBalance ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Заказы">{clientDetails.ordersCount ?? "—"}</Descriptions.Item>
                            <Descriptions.Item label="Средний чек">{clientDetails.averageCheck ?? "—"}</Descriptions.Item>
                        </Descriptions>
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
