import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import type {OrderStatusNotification, OrderStatusNotificationLog} from "../../features/order-notifications/orderNotificationTypes.ts"
import {
    useCreateOrderStatusNotificationMutation,
    useDeleteOrderStatusNotificationMutation,
    useGetOrderStatusNotificationLogsQuery,
    useGetOrderStatusNotificationsQuery,
    useUpdateOrderStatusNotificationMutation
} from "../../features/order-notifications/orderNotificationApi.ts"
import {useGetOrderStatusesQuery} from "../../features/order-status/orderStatusApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const typeLabelMap = {
    sms: "SMS",
    email: "Email",
    push: "Push",
    telegram: "Telegram",
    webhook: "Webhook"
} as const

const recipientLabelMap = {
    client: "Клиент",
    manager: "Менеджер",
    courier: "Курьер",
    admin: "Администратор"
} as const

const logStatusMeta = {
    queued: {label: "В очереди", color: "blue"},
    sent: {label: "Отправлено", color: "green"},
    failed: {label: "Ошибка", color: "red"},
    skipped: {label: "Пропущено", color: "orange"}
} as const

const typeOptions = Object.entries(typeLabelMap).map(([value, label]) => ({label, value}))
const sendToOptions = Object.entries(recipientLabelMap).map(([value, label]) => ({label, value}))

type FormValues = {
    statusId: number
    type: "sms" | "email" | "push" | "telegram" | "webhook"
    sendTo: "client" | "manager" | "courier" | "admin"
    template: string
    isActive: boolean
}

type RuleStateFilter = "all" | "active" | "inactive"
type LogStatusFilter = "all" | OrderStatusNotificationLog["status"]

const OrderNotificationsPage = () => {
    const {data: statuses} = useGetOrderStatusesQuery()
    const {data: configs, isLoading: isLoadingConfigs, isFetching: isFetchingConfigs, isError: isConfigsError, refetch: refetchConfigs} = useGetOrderStatusNotificationsQuery()
    const {data: logs, isLoading: isLoadingLogs, isError: isLogsError, refetch: refetchLogs} = useGetOrderStatusNotificationLogsQuery()
    const [createConfig, {isLoading: isCreating}] = useCreateOrderStatusNotificationMutation()
    const [updateConfig, {isLoading: isUpdating}] = useUpdateOrderStatusNotificationMutation()
    const [deleteConfig, {isLoading: isDeleting}] = useDeleteOrderStatusNotificationMutation()

    const [isModalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<OrderStatusNotification | null>(null)
    const [configSearch, setConfigSearch] = useState("")
    const [configStateFilter, setConfigStateFilter] = useState<RuleStateFilter>("all")
    const [logSearch, setLogSearch] = useState("")
    const [logStatusFilter, setLogStatusFilter] = useState<LogStatusFilter>("all")
    const [deletingConfigId, setDeletingConfigId] = useState<number | null>(null)
    const [form] = Form.useForm<FormValues>()

    const isConfigListUnsafe = isConfigsError || isLoadingConfigs || isFetchingConfigs
    const isSavingConfig = isCreating || isUpdating
    const isConfigMutationLocked = isConfigListUnsafe || isSavingConfig || isDeleting
    const statusMap = useMemo(() => new Map((statuses || []).map((status) => [status.id, status.title])), [statuses])
    const filteredConfigs = useMemo(() => {
        const query = configSearch.trim().toLowerCase()

        return (configs || []).filter((item) => {
            const matchesState = configStateFilter === "all" || (configStateFilter === "active" ? item.isActive : !item.isActive)
            const statusTitle = statusMap.get(item.statusId) || ""
            const searchableText = [
                item.id,
                item.statusId,
                statusTitle,
                typeLabelMap[item.type],
                item.type,
                recipientLabelMap[item.sendTo],
                item.sendTo,
                item.template
            ].join(" ").toLowerCase()

            return matchesState && (!query || searchableText.includes(query))
        })
    }, [configSearch, configStateFilter, configs, statusMap])

    const hasConfigFilters = configSearch.trim().length > 0 || configStateFilter !== "all"
    const resetConfigFilters = () => {
        setConfigSearch("")
        setConfigStateFilter("all")
    }
    const filteredLogs = useMemo(() => {
        const query = logSearch.trim().toLowerCase()

        return (logs || []).filter((item) => {
            const matchesStatus = logStatusFilter === "all" || item.status === logStatusFilter
            const searchableText = [
                item.id,
                item.orderId,
                logStatusMeta[item.status]?.label,
                item.status,
                item.recipient,
                item.error,
                item.createdAt ? new Date(item.createdAt).toLocaleString("ru-RU") : ""
            ].join(" ").toLowerCase()

            return matchesStatus && (!query || searchableText.includes(query))
        })
    }, [logSearch, logStatusFilter, logs])

    const hasLogFilters = logSearch.trim().length > 0 || logStatusFilter !== "all"
    const resetLogFilters = () => {
        setLogSearch("")
        setLogStatusFilter("all")
    }
    const notificationSummary = useMemo(() => {
        const safeConfigs = configs || []
        const safeLogs = logs || []
        const enabledRules = safeConfigs.filter((item) => item.isActive).length
        const disabledRules = safeConfigs.length - enabledRules
        const failedLogs = safeLogs.filter((item) => item.status === "failed").length
        const queuedLogs = safeLogs.filter((item) => item.status === "queued").length

        return {
            totalRules: safeConfigs.length,
            enabledRules,
            disabledRules,
            failedLogs,
            queuedLogs
        }
    }, [configs, logs])

    const openCreate = () => {
        if (isConfigListUnsafe) {
            message.warning("Сначала дождитесь актуального списка правил или повторите загрузку")
            return
        }

        setEditing(null)
        form.resetFields()
        form.setFieldsValue({isActive: true, type: "sms", sendTo: "client"})
        setModalOpen(true)
    }

    const openEdit = (item: OrderStatusNotification) => {
        if (isConfigListUnsafe) {
            message.warning("Сначала обновите список правил, чтобы не редактировать устаревшие настройки")
            return
        }

        setEditing(item)
        form.setFieldsValue(item)
        setModalOpen(true)
    }

    const saveConfig = async () => {
        if (isConfigListUnsafe) {
            message.warning("Сохранение заблокировано: список правил не подтверждён API")
            return
        }

        try {
            const values = await form.validateFields()
            if (editing) {
                await updateConfig({id: editing.id, body: values}).unwrap()
                message.success("Конфиг уведомления обновлён")
            } else {
                await createConfig(values).unwrap()
                message.success("Конфиг уведомления создан")
            }
            setModalOpen(false)
        } catch (error) {
            if (error && typeof error === "object" && "errorFields" in error) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const removeConfig = async (id: number) => {
        if (isConfigListUnsafe) {
            message.warning("Удаление заблокировано: сначала повторите загрузку правил")
            return
        }

        setDeletingConfigId(id)
        try {
            await deleteConfig(id).unwrap()
            message.success("Конфиг уведомления удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingConfigId(null)
        }
    }

    const configColumns: ColumnsType<OrderStatusNotification> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Статус", dataIndex: "statusId", render: (id: number) => statusMap.get(id) || `ID ${id}`},
        {title: "Канал", dataIndex: "type", render: (type: FormValues["type"]) => typeLabelMap[type] || type},
        {title: "Получатель", dataIndex: "sendTo", render: (sendTo: FormValues["sendTo"]) => recipientLabelMap[sendTo] || sendTo},
        {title: "Состояние", dataIndex: "isActive", render: (v) => <Tag color={v ? "green" : "default"}>{v ? "Активно" : "Выключено"}</Tag>},
        {
            title: "Шаблон",
            dataIndex: "template",
            render: (value: string) => <Typography.Text ellipsis={{tooltip: value}}>{value || "—"}</Typography.Text>
        },
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, item) => {
                const isCurrentDeleting = deletingConfigId === item.id

                return (
                    <Space>
                        <Button type="link" onClick={() => openEdit(item)} disabled={isConfigMutationLocked}>
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить правило уведомления?"
                            description="Перед удалением проверьте, что менеджеры не потеряют важное уведомление по этому статусу. Логи отправки останутся для аудита."
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{loading: isCurrentDeleting}}
                            onConfirm={() => removeConfig(item.id)}
                        >
                            <Button type="link" danger loading={isCurrentDeleting} disabled={isConfigMutationLocked && !isCurrentDeleting}>
                                {isCurrentDeleting ? "Удаляем" : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    const logsColumns: ColumnsType<OrderStatusNotificationLog> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Заказ", dataIndex: "orderId", width: 90, render: (orderId: number) => `#${orderId}`},
        {
            title: "Статус",
            dataIndex: "status",
            render: (status: OrderStatusNotificationLog["status"]) => {
                const meta = logStatusMeta[status] || {label: status, color: "default"}
                return <Tag color={meta.color}>{meta.label}</Tag>
            }
        },
        {title: "Получатель", dataIndex: "recipient", render: (v) => v || "—"},
        {title: "Ошибка", dataIndex: "error", render: (v) => v || "—"},
        {title: "Дата", dataIndex: "createdAt", render: (value: string) => value ? new Date(value).toLocaleString("ru-RU") : "—"}
    ]

    return (
        <Space orientation="vertical" size={16} style={{width: "100%"}}>
            <Alert
                type="info"
                showIcon
                message="Проверяйте правила уведомлений перед сменой статусов"
                description="Активное правило может отправить сообщение клиенту, курьеру или команде. Используйте понятный шаблон и выключайте правило, если канал ещё не готов к работе."
            />

            <Alert
                type={notificationSummary.failedLogs > 0 ? "warning" : "success"}
                showIcon
                message="Операционная сводка уведомлений"
                description={(
                    <Space size={[8, 8]} wrap>
                        <Tag color="blue">Правил: {notificationSummary.totalRules}</Tag>
                        <Tag color="geekblue">Найдено: {filteredConfigs.length}</Tag>
                        <Tag color={hasLogFilters ? "purple" : "default"}>Логов найдено: {filteredLogs.length}</Tag>
                        <Tag color="green">Активно: {notificationSummary.enabledRules}</Tag>
                        <Tag color="default">Выключено: {notificationSummary.disabledRules}</Tag>
                        <Tag color={notificationSummary.queuedLogs > 0 ? "processing" : "default"}>В очереди: {notificationSummary.queuedLogs}</Tag>
                        <Tag color={notificationSummary.failedLogs > 0 ? "red" : "default"}>Ошибок: {notificationSummary.failedLogs}</Tag>
                        <Typography.Text type="secondary">
                            Если есть ошибки, сначала проверьте логи и шаблон, затем меняйте правила отправки.
                        </Typography.Text>
                    </Space>
                )}
            />

            <SettingsTableSection
                title="Уведомления по статусам"
                subtitle="Правила отправки сообщений при смене статуса заказа: канал, получатель, шаблон и активность."
                addButtonText="Добавить правило"
                onAdd={openCreate}
                addButtonDisabled={isConfigMutationLocked}
            >
                <Space size={[8, 8]} wrap style={{padding: "16px 16px 0", width: "100%"}}>
                    <Input.Search
                        allowClear
                        placeholder="Найти по статусу, каналу, получателю, шаблону или ID"
                        value={configSearch}
                        onChange={(event) => setConfigSearch(event.target.value)}
                        style={{minWidth: 280, maxWidth: 460}}
                    />
                    <Select<RuleStateFilter>
                        value={configStateFilter}
                        onChange={setConfigStateFilter}
                        style={{width: 180}}
                        options={[
                            {label: "Все правила", value: "all"},
                            {label: "Только активные", value: "active"},
                            {label: "Только выключенные", value: "inactive"}
                        ]}
                    />
                    <Tag color={hasConfigFilters ? "blue" : "default"}>Показано {filteredConfigs.length} из {notificationSummary.totalRules}</Tag>
                    {hasConfigFilters && <Button onClick={resetConfigFilters}>Сбросить фильтры</Button>}
                </Space>
                {isConfigsError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить правила уведомлений"
                        description="Проверьте соединение или повторите попытку, чтобы не редактировать настройки вслепую."
                        action={<Button onClick={() => refetchConfigs()} loading={isFetchingConfigs}>Повторить</Button>}
                        style={{margin: 16}}
                    />
                )}
                <Table
                    rowKey="id"
                    loading={isLoadingConfigs}
                    dataSource={filteredConfigs}
                    columns={configColumns}
                    pagination={false}
                    scroll={{x: 900}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={hasConfigFilters ? "По текущим фильтрам правил не найдено" : "Правила уведомлений ещё не настроены"}
                            >
                                {hasConfigFilters ? (
                                    <Button onClick={resetConfigFilters}>Сбросить фильтры</Button>
                                ) : (
                                    <Button type="primary" onClick={openCreate} disabled={isConfigMutationLocked}>Добавить первое правило</Button>
                                )}
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <SettingsTableSection
                title="Логи уведомлений"
                subtitle="История queued/sent/failed/skipped помогает быстро понять, дошло ли уведомление и что пошло не так."
                addButtonText="Обновить"
                onAdd={() => refetchLogs()}
            >
                <Space size={[8, 8]} wrap style={{padding: "16px 16px 0", width: "100%"}}>
                    <Input.Search
                        allowClear
                        placeholder="Найти по заказу, получателю, ошибке, статусу или ID"
                        value={logSearch}
                        onChange={(event) => setLogSearch(event.target.value)}
                        style={{minWidth: 280, maxWidth: 460}}
                    />
                    <Select<LogStatusFilter>
                        value={logStatusFilter}
                        onChange={setLogStatusFilter}
                        style={{width: 190}}
                        options={[
                            {label: "Все статусы", value: "all"},
                            {label: "В очереди", value: "queued"},
                            {label: "Отправлено", value: "sent"},
                            {label: "Ошибка", value: "failed"},
                            {label: "Пропущено", value: "skipped"}
                        ]}
                    />
                    <Tag color={hasLogFilters ? "purple" : "default"}>Показано {filteredLogs.length} из {(logs || []).length}</Tag>
                    {hasLogFilters && <Button onClick={resetLogFilters}>Сбросить фильтры логов</Button>}
                </Space>
                {isLogsError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить логи уведомлений"
                        description="Без логов менеджер не увидит причину неотправленного сообщения. Повторите загрузку перед разбором инцидента."
                        action={<Button onClick={() => refetchLogs()}>Повторить</Button>}
                        style={{margin: 16}}
                    />
                )}
                <Table
                    rowKey="id"
                    loading={isLoadingLogs}
                    dataSource={filteredLogs}
                    columns={logsColumns}
                    scroll={{x: 900}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={hasLogFilters ? "По текущим фильтрам логи не найдены" : "Логов отправки пока нет"}
                            >
                                {hasLogFilters && <Button onClick={resetLogFilters}>Сбросить фильтры логов</Button>}
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editing ? "Редактировать правило уведомления" : "Создать правило уведомления"}
                open={isModalOpen}
                onCancel={() => {
                    if (!isSavingConfig) setModalOpen(false)
                }}
                onOk={saveConfig}
                confirmLoading={isSavingConfig}
                okText={isSavingConfig ? "Сохраняем…" : editing ? "Сохранить" : "Создать"}
                okButtonProps={{disabled: isConfigListUnsafe || isDeleting}}
                cancelButtonProps={{disabled: isSavingConfig}}
                closable={!isSavingConfig}
                maskClosable={!isSavingConfig}
                keyboard={!isSavingConfig}
            >
                {isConfigListUnsafe && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Дождитесь актуального списка правил"
                        description="Создание и редактирование заблокированы, пока API не подтвердит текущие правила уведомлений. Это защищает от изменения устаревшей доставки сообщений."
                        style={{marginBottom: 16}}
                    />
                )}
                <Form form={form} layout="vertical" disabled={isConfigMutationLocked}>
                    <Form.Item name="statusId" label="Статус заказа" rules={[{required: true}]}>
                        <Select options={(statuses || []).map((status) => ({label: status.title, value: status.id}))} />
                    </Form.Item>
                    <Form.Item name="type" label="Тип уведомления" rules={[{required: true}]}>
                        <Select options={typeOptions} />
                    </Form.Item>
                    <Form.Item name="sendTo" label="Кому отправлять" rules={[{required: true}]}>
                        <Select options={sendToOptions} />
                    </Form.Item>
                    <Form.Item
                        name="template"
                        label="Шаблон сообщения"
                        extra="Проверьте переменные перед сохранением: например, {{orderNumber}} и {{status}}. Не добавляйте секреты, пароли или внутренние токены."
                        rules={[{required: true, message: "Добавьте текст шаблона уведомления"}]}
                    >
                        <Input.TextArea rows={4} placeholder="Например: Заказ {{orderNumber}} перешёл в статус {{status}}" />
                    </Form.Item>
                    <Form.Item
                        name="isActive"
                        label="Активно"
                        valuePropName="checked"
                        extra="Оставьте выключенным, если канал ещё не проверен или шаблон требует согласования."
                    >
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default OrderNotificationsPage
