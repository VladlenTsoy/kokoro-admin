import {Alert, Button, Card, Col, Descriptions, Drawer, Empty, Form, Input, Modal, Row, Segmented, Space, Statistic, Table, Tabs, Tag, Typography, message} from "antd"
import {CrownOutlined, PhoneOutlined, ReloadOutlined, ShoppingOutlined, TeamOutlined} from "@ant-design/icons"
import type {ColumnsType} from "antd/es/table"
import {useEffect, useState} from "react"
import {useNavigate, useSearchParams} from "react-router-dom"
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
import {getBonusOperationMeta, getDeliveryStatusMeta, getPaymentStatusMeta} from "../utils/adminStatusMeta.ts"
import dayjs from "dayjs"

const formatSignedBonusAmount = (value?: number) => {
    if (value === undefined || value === null) return "—"
    const prefix = value > 0 ? "+" : ""
    return `${prefix}${value}`
}

const renderClientTabEmpty = (title: string, description: string) => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={(
            <Space direction="vertical" size={4}>
                <Typography.Text strong>{title}</Typography.Text>
                <Typography.Text type="secondary">{description}</Typography.Text>
            </Space>
        )}
    />
)

const renderClientTabWarning = (messageText: string, error: unknown, onRetry: () => void) => (
    <Alert
        type="warning"
        showIcon
        style={{marginBottom: 12}}
        message={messageText}
        description={(
            <Space direction="vertical" size={8}>
                <Typography.Text>{getNestErrorMessage(error)}</Typography.Text>
                <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>Повторить</Button>
            </Space>
        )}
    />
)

type ClientStatusFilter = "all" | "active" | "blocked"

const getPositiveClientIdFromSearch = (searchParams: URLSearchParams) => {
    const clientId = Number(searchParams.get("clientId"))
    return Number.isInteger(clientId) && clientId > 0 ? clientId : null
}

const ClientsPage = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [filters, setFilters] = useState<{search?: string; status: ClientStatusFilter; page: number; pageSize: number}>({
        search: "",
        status: "all",
        page: 1,
        pageSize: 20
    })
    const [selectedClientId, setSelectedClientId] = useState<number | null>(() => getPositiveClientIdFromSearch(searchParams))
    const [editingClientId, setEditingClientId] = useState<number | null>(null)
    const [statusChangingClientId, setStatusChangingClientId] = useState<number | null>(null)
    const [isEditModalOpen, setEditModalOpen] = useState(false)
    const [editForm] = Form.useForm<{name?: string; phone?: string}>()

    const {
        data,
        error: clientsError,
        isFetching: isClientsFetching,
        isLoading,
        refetch: refetchClients
    } = useGetClientsQuery({
        search: filters.search || undefined,
        isActive: filters.status === "all" ? undefined : filters.status === "active" ? "true" : "false",
        page: filters.page,
        pageSize: filters.pageSize
    })
    const {
        data: clientDetails,
        isFetching: isClientLoading,
        error: clientDetailsError,
        refetch: refetchClientDetails
    } = useGetClientByIdQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {
        data: clientOrders,
        isFetching: isClientOrdersLoading,
        error: clientOrdersError,
        refetch: refetchClientOrders
    } = useGetClientOrdersQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {
        data: clientAddresses,
        isFetching: isClientAddressesLoading,
        error: clientAddressesError,
        refetch: refetchClientAddresses
    } = useGetClientAddressesQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const {
        data: clientBonusTransactions,
        isFetching: isClientBonusLoading,
        error: clientBonusError,
        refetch: refetchClientBonus
    } = useGetClientBonusTransactionsQuery(selectedClientId ?? 0, {
        skip: !selectedClientId
    })
    const [blockClient] = useBlockClientMutation()
    const [unblockClient] = useUnblockClientMutation()
    const [updateClient, {isLoading: isUpdating}] = useUpdateClientMutation()
    const canUpdateClients = useCan("clients.update")
    const canDeleteClients = useCan("clients.delete")
    const clients = data?.items || []
    const activeClientsOnPage = clients.filter((client) => client.isActive).length
    const buyersOnPage = clients.filter((client) => (client.ordersCount ?? 0) > 0).length
    const totalSpentOnPage = clients.reduce((sum, client) => sum + Number(client.totalSpent || 0), 0)
    const hasActiveFilters = Boolean(filters.search) || filters.status !== "all"

    useEffect(() => {
        const clientIdFromUrl = getPositiveClientIdFromSearch(searchParams)
        setSelectedClientId((currentClientId) => currentClientId === clientIdFromUrl ? currentClientId : clientIdFromUrl)
    }, [searchParams])

    const updateSelectedClientId = (id: number | null) => {
        setSelectedClientId(id)
        setSearchParams((previousParams) => {
            const nextParams = new URLSearchParams(previousParams)
            if (id) {
                nextParams.set("clientId", String(id))
            } else {
                nextParams.delete("clientId")
            }
            return nextParams
        }, {replace: !id})
    }

    const resetClientFilters = () => setFilters((prev) => ({...prev, search: "", status: "all", page: 1}))

    const openClientOrder = (order: AdminClientOrder) => {
        navigate(`/orders?orderId=${order.id}`)
    }

    const handleBlockToggle = async (client: AdminClient) => {
        setStatusChangingClientId(client.id)
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
        } finally {
            setStatusChangingClientId(null)
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

    const handleEditCancel = () => {
        if (isUpdating) return
        closeEdit()
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
        {title: "Статус", key: "status", width: 220, render: (_, order) => {
            const paymentStatus = getPaymentStatusMeta(order.paymentStatus)
            const deliveryStatus = getDeliveryStatusMeta(order.deliveryStatus)

            return (
                <Space wrap size={[4, 4]}>
                    {order.status?.title && <Tag color="blue">{order.status.title}</Tag>}
                    {paymentStatus && <Tag color={paymentStatus.color}>{paymentStatus.label}</Tag>}
                    {deliveryStatus && <Tag color={deliveryStatus.color}>{deliveryStatus.label}</Tag>}
                </Space>
            )
        }},
        {
            title: "Действие",
            key: "actions",
            width: 150,
            render: (_, order) => <Button size="small" onClick={() => openClientOrder(order)}>Открыть заказ</Button>
        }
    ]

    const bonusColumns: ColumnsType<AdminClientBonusTransaction> = [
        {title: "Дата", dataIndex: "createdAt", width: 130, render: (value?: string) => (value ? dayjs(value).format("DD.MM HH:mm") : "—")},
        {title: "Тип", dataIndex: "type", width: 140, render: (value?: string) => {
            const operation = getBonusOperationMeta(value)
            return operation ? <Tag color={operation.color}>{operation.label}</Tag> : "—"
        }},
        {
            title: "Сумма",
            dataIndex: "amount",
            width: 120,
            render: (value?: number) => (
                <Typography.Text type={value && value < 0 ? "danger" : value && value > 0 ? "success" : undefined}>
                    {formatSignedBonusAmount(value)}
                </Typography.Text>
            )
        },
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
                <Space wrap size={[8, 8]}>
                    <Button onClick={() => updateSelectedClientId(client.id)}>Открыть</Button>
                    {canUpdateClients && <Button onClick={() => openEdit(client)}>Редактировать</Button>}
                    {canDeleteClients && (
                        <Button
                            danger={client.isActive}
                            disabled={Boolean(statusChangingClientId && statusChangingClientId !== client.id)}
                            loading={statusChangingClientId === client.id}
                            onClick={() => handleBlockToggle(client)}
                        >
                            {client.isActive ? "Блок" : "Разблок"}
                        </Button>
                    )}
                </Space>
            )
        }
    ]

    const clientOrderCount = clientDetails?.stats?.ordersCount ?? clientDetails?.ordersCount ?? 0
    const clientAttentionItems = clientDetails ? [
        !clientDetails.phone && {
            color: "orange",
            label: "Нет телефона",
            description: "Перед поддержкой или доставкой уточните контакт: менеджер не сможет быстро связаться с клиентом из CRM."
        },
        !clientDetails.isActive && {
            color: "red",
            label: "Заблокирован",
            description: "Проверьте причину блокировки до ручного заказа, бонусной корректировки или обещаний клиенту."
        },
        clientOrderCount === 0 && {
            color: "blue",
            label: "Первый заказ",
            description: "Истории покупок ещё нет — сверяйте адрес, телефон и ожидания особенно внимательно."
        }
    ].filter(Boolean) as Array<{color: string; label: string; description: string}> : []

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <Card className="admin-hero-card clients-hero">
                <PageHeading
                    title="Клиенты"
                    subtitle="CRM-вид: быстро найти человека, увидеть ценность клиента и открыть историю без ощущения сырой таблицы."
                />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={6}>
                    <Card className="metric-card metric-card--lime"><Statistic prefix={<TeamOutlined />} title="Всего клиентов" value={data?.total ?? 0} loading={isLoading} /></Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card className="metric-card metric-card--cyan"><Statistic prefix={<PhoneOutlined />} title="Активные на странице" value={activeClientsOnPage} loading={isLoading} /></Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card className="metric-card metric-card--blue"><Statistic prefix={<ShoppingOutlined />} title="С покупками" value={buyersOnPage} loading={isLoading} /></Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card className="metric-card metric-card--money"><Statistic prefix={<CrownOutlined />} title="Оборот страницы" value={formatMoney(totalSpentOnPage)} loading={isLoading} /></Card>
                </Col>
            </Row>

            <Card className="filter-card">
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Space wrap align="center" size={[12, 12]}>
                        <Input.Search
                            placeholder="Поиск по имени или телефону"
                            allowClear
                            enterButton="Найти"
                            value={filters.search}
                            onChange={(event) => setFilters((prev) => ({...prev, search: event.target.value}))}
                            onSearch={(search) => setFilters((prev) => ({...prev, search, page: 1}))}
                            style={{width: 360, maxWidth: "100%"}}
                        />
                        <Segmented<ClientStatusFilter>
                            value={filters.status}
                            onChange={(status) => setFilters((prev) => ({...prev, status, page: 1}))}
                            options={[
                                {label: "Все", value: "all"},
                                {label: "Активные", value: "active"},
                                {label: "Заблокированные", value: "blocked"}
                            ]}
                        />
                        {hasActiveFilters && <Button onClick={resetClientFilters}>Сбросить фильтры</Button>}
                    </Space>
                    <Space wrap size={[8, 8]}>
                        <Tag color={hasActiveFilters ? "blue" : "default"}>
                            {hasActiveFilters ? "Показаны отфильтрованные клиенты" : "Показаны все клиенты"}
                        </Tag>
                        <Typography.Text type="secondary">
                            {data?.total ?? 0} совпадений; на странице {clients.length}, активных {activeClientsOnPage}, с покупками {buyersOnPage}.
                        </Typography.Text>
                    </Space>
                </Space>
            </Card>

            <Card className="admin-table-card clients-table-card">
                {clientsError && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{marginBottom: 12}}
                        message="Список клиентов не обновился"
                        description={(
                            <Space direction="vertical" size={8}>
                                <Typography.Text>{getNestErrorMessage(clientsError)}</Typography.Text>
                                <Typography.Text type="secondary">
                                    Не блокируйте и не меняйте CRM-статусы по старой выдаче: список может не учитывать последние регистрации, заказы или изменения доступа.
                                </Typography.Text>
                                <Button size="small" icon={<ReloadOutlined />} loading={isClientsFetching} onClick={() => refetchClients()}>
                                    Повторить загрузку
                                </Button>
                            </Space>
                        )}
                    />
                )}
                <Table<AdminClient>
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={clients}
                    pagination={{
                        current: data?.page || filters.page,
                        pageSize: data?.pageSize || filters.pageSize,
                        total: data?.total || 0,
                        onChange: (page, pageSize) => setFilters((prev) => ({...prev, page, pageSize}))
                    }}
                    locale={{
                        emptyText: hasActiveFilters ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={(
                                    <Space direction="vertical" size={4}>
                                        <Typography.Text strong>Клиенты не найдены</Typography.Text>
                                        <Typography.Text type="secondary">Сбросьте поиск или статус, чтобы не пропустить нужного клиента перед блокировкой или поддержкой.</Typography.Text>
                                        <Button size="small" onClick={resetClientFilters}>Сбросить фильтры</Button>
                                    </Space>
                                )}
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Клиенты появятся здесь после регистрации или первого заказа."
                            />
                        )
                    }}
                />
            </Card>

            <Drawer
                className="profile-drawer"
                title={clientDetails ? `Клиент #${clientDetails.id}` : "Карточка клиента"}
                width={760}
                open={Boolean(selectedClientId)}
                onClose={() => updateSelectedClientId(null)}
            >
                {isClientLoading && <Typography.Text type="secondary">Загружаем карточку клиента, историю заказов и данные для поддержки...</Typography.Text>}
                {!isClientLoading && clientDetailsError && !clientDetails && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Карточка клиента не загрузилась"
                        description={(
                            <Space direction="vertical" size={8}>
                                <Typography.Text>{getNestErrorMessage(clientDetailsError)}</Typography.Text>
                                <Typography.Text type="secondary">Не меняйте статус клиента, пока профиль не открыт: история заказов и контакты могут быть неполными.</Typography.Text>
                                <Button icon={<ReloadOutlined />} onClick={() => refetchClientDetails()}>
                                    Повторить загрузку
                                </Button>
                            </Space>
                        )}
                    />
                )}
                {!isClientLoading && !clientDetailsError && !clientDetails && selectedClientId && (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={(
                            <Space direction="vertical" size={4}>
                                <Typography.Text strong>Клиент не найден</Typography.Text>
                                <Typography.Text type="secondary">Профиль мог быть удалён или недоступен для вашей роли. Вернитесь к списку и обновите поиск.</Typography.Text>
                            </Space>
                        )}
                    />
                )}
                {!isClientLoading && clientDetails && (
                    <Space direction="vertical" size={16} style={{width: "100%"}}>
                        {clientAttentionItems.length > 0 && (
                            <Alert
                                type="warning"
                                showIcon
                                message="Проверьте CRM-контекст перед действием"
                                description={(
                                    <Space direction="vertical" size={8}>
                                        {clientAttentionItems.map((item) => (
                                            <Space key={item.label} wrap align="start" size={[8, 4]}>
                                                <Tag color={item.color}>{item.label}</Tag>
                                                <Typography.Text>{item.description}</Typography.Text>
                                            </Space>
                                        ))}
                                    </Space>
                                )}
                            />
                        )}

                        <Descriptions className="profile-summary" bordered size="small" column={2}>
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
                            className="profile-tabs"
                            items={[
                                {
                                    key: "orders",
                                    label: `Заказы (${clientOrders?.total ?? 0})`,
                                    children: (
                                        <>
                                            {clientOrdersError && renderClientTabWarning("История заказов загрузилась не полностью", clientOrdersError, refetchClientOrders)}
                                            <Table<AdminClientOrder>
                                                rowKey="id"
                                                loading={isClientOrdersLoading}
                                                columns={orderColumns}
                                                dataSource={clientOrders?.items || []}
                                                pagination={false}
                                                size="small"
                                                scroll={{x: 560}}
                                                locale={{
                                                    emptyText: renderClientTabEmpty(
                                                        "Заказов пока нет",
                                                        "Когда клиент оформит заказ, здесь появятся сумма, дата и статусы для поддержки."
                                                    )
                                                }}
                                            />
                                        </>
                                    )
                                },
                                {
                                    key: "addresses",
                                    label: `Адреса (${clientAddresses?.length ?? 0})`,
                                    children: (
                                        <>
                                            {clientAddressesError && renderClientTabWarning("Адреса клиента загрузились не полностью", clientAddressesError, refetchClientAddresses)}
                                            <Table
                                                rowKey="id"
                                                loading={isClientAddressesLoading}
                                                dataSource={clientAddresses || []}
                                                pagination={false}
                                                size="small"
                                                scroll={{x: 420}}
                                                locale={{
                                                    emptyText: renderClientTabEmpty(
                                                        "Адреса не сохранены",
                                                        "Попросите клиента уточнить адрес при следующем заказе или звонке."
                                                    )
                                                }}
                                                columns={[
                                                    {title: "Адрес", dataIndex: "address", render: (value?: string) => value || "—"}
                                                ]}
                                            />
                                        </>
                                    )
                                },
                                {
                                    key: "bonuses",
                                    label: `Бонусы (${clientBonusTransactions?.length ?? 0})`,
                                    children: (
                                        <>
                                            {clientBonusError && renderClientTabWarning("Бонусная история загрузилась не полностью", clientBonusError, refetchClientBonus)}
                                            <Table<AdminClientBonusTransaction>
                                                rowKey="id"
                                                loading={isClientBonusLoading}
                                                columns={bonusColumns}
                                                dataSource={clientBonusTransactions || []}
                                                pagination={false}
                                                size="small"
                                                scroll={{x: 560}}
                                                locale={{
                                                    emptyText: renderClientTabEmpty(
                                                        "Бонусных операций нет",
                                                        "Начисления, списания и ручные корректировки появятся здесь после первой операции."
                                                    )
                                                }}
                                            />
                                        </>
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
                onCancel={handleEditCancel}
                onOk={saveEdit}
                confirmLoading={isUpdating}
                okText={isUpdating ? "Сохраняем клиента..." : "Сохранить клиента"}
                cancelText="Отмена"
                cancelButtonProps={{disabled: isUpdating}}
                closable={!isUpdating}
                keyboard={!isUpdating}
                maskClosable={!isUpdating}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type={isUpdating ? "warning" : "info"}
                        showIcon
                        message={isUpdating ? "Сохраняем CRM-данные клиента" : "Проверьте данные перед сохранением"}
                        description={isUpdating
                            ? "Не закрывайте окно и не меняйте поля: имя и телефон уже отправляются в API, чтобы избежать смешанных контактных данных."
                            : "Имя и телефон видны в CRM, заказах и поддержке. Не очищайте телефон без подтверждения: менеджеры могут потерять быстрый контакт для звонка или доставки."
                        }
                    />
                    <Form form={editForm} layout="vertical" disabled={isUpdating}>
                        <Form.Item
                            name="name"
                            label="Имя"
                            extra="Используйте понятное имя клиента для поиска и поддержки. Если клиент не назвал имя, оставьте поле пустым."
                        >
                            <Input autoComplete="name" placeholder="Например: Анна" />
                        </Form.Item>
                        <Form.Item
                            name="phone"
                            label="Телефон"
                            extra="Лучше сохранять телефон в международном формате. Это снижает ошибки при поиске клиента и передаче заказа курьеру."
                        >
                            <Input inputMode="tel" autoComplete="tel" placeholder="Например: +998 90 123 45 67" />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </Space>
    )
}

export default ClientsPage
