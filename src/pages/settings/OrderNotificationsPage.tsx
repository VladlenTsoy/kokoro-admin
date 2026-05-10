import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useState} from "react"
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

type FormValues = {
    statusId: number
    type: "sms" | "email" | "push" | "telegram" | "webhook"
    sendTo: "client" | "manager" | "courier" | "admin"
    template: string
    isActive: boolean
}

const typeLabels: Record<FormValues["type"], string> = {
    sms: "SMS",
    email: "Email",
    push: "Push",
    telegram: "Telegram",
    webhook: "Webhook"
}
const sendToLabels: Record<FormValues["sendTo"], string> = {
    client: "Клиент",
    manager: "Менеджер",
    courier: "Курьер",
    admin: "Админ"
}

const typeOptions = ["sms", "email", "push", "telegram", "webhook"].map((value) => ({
    label: typeLabels[value as FormValues["type"]],
    value
}))
const sendToOptions = ["client", "manager", "courier", "admin"].map((value) => ({
    label: sendToLabels[value as FormValues["sendTo"]],
    value
}))

const OrderNotificationsPage = () => {
    const {data: statuses} = useGetOrderStatusesQuery()
    const {data: configs, isLoading: isLoadingConfigs} = useGetOrderStatusNotificationsQuery()
    const {data: logs, isLoading: isLoadingLogs} = useGetOrderStatusNotificationLogsQuery()
    const [createConfig, {isLoading: isCreating}] = useCreateOrderStatusNotificationMutation()
    const [updateConfig, {isLoading: isUpdating}] = useUpdateOrderStatusNotificationMutation()
    const [deleteConfig] = useDeleteOrderStatusNotificationMutation()

    const [isModalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<OrderStatusNotification | null>(null)
    const [form] = Form.useForm<FormValues>()

    const statusMap = new Map((statuses || []).map((status) => [status.id, status.title]))

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        form.setFieldsValue({isActive: true, type: "sms", sendTo: "client"})
        setModalOpen(true)
    }

    const openEdit = (item: OrderStatusNotification) => {
        setEditing(item)
        form.setFieldsValue(item)
        setModalOpen(true)
    }

    const saveConfig = async () => {
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
            message.error(getNestErrorMessage(error))
        }
    }

    const removeConfig = async (id: number) => {
        try {
            await deleteConfig(id).unwrap()
            message.success("Конфиг уведомления удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const configColumns: ColumnsType<OrderStatusNotification> = [
        {
            title: "Правило",
            key: "rule",
            width: 260,
            render: (_, item) => (
                <Space orientation="vertical" size={2}>
                    <Typography.Text strong>{statusMap.get(item.statusId) || `Статус #${item.statusId}`}</Typography.Text>
                    <Typography.Text type="secondary">ID {item.id}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Канал",
            dataIndex: "type",
            width: 120,
            render: (type: FormValues["type"]) => <Tag color="blue">{typeLabels[type] || type}</Tag>
        },
        {
            title: "Получатель",
            dataIndex: "sendTo",
            width: 140,
            render: (sendTo: FormValues["sendTo"]) => sendToLabels[sendTo] || sendTo
        },
        {
            title: "Статус",
            dataIndex: "isActive",
            width: 120,
            render: (isActive) => <Tag color={isActive ? "green" : "default"}>{isActive ? "Активно" : "Пауза"}</Tag>
        },
        {
            title: "Шаблон",
            dataIndex: "template",
            render: (template: string) => (
                <Typography.Text type="secondary">
                    {template.length > 64 ? `${template.slice(0, 64)}...` : template}
                </Typography.Text>
            )
        },
        {
            title: "Действия",
            key: "actions",
            width: 240,
            render: (_, item) => (
                <Space wrap>
                    <Button type="link" onClick={() => openEdit(item)}>Редактировать</Button>
                    <Popconfirm
                        title="Удалить правило уведомления?"
                        description="После удаления новые заказы не будут получать это уведомление."
                        onConfirm={() => removeConfig(item.id)}
                        okText="Удалить"
                        cancelText="Отмена"
                    >
                        <Button type="link" danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    const logsColumns: ColumnsType<OrderStatusNotificationLog> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Заказ", dataIndex: "orderId", width: 100, render: (orderId) => `#${orderId}`},
        {
            title: "Статус отправки",
            dataIndex: "status",
            width: 150,
            render: (status: OrderStatusNotificationLog["status"]) => {
                const color = status === "sent" ? "green" : status === "failed" ? "red" : status === "skipped" ? "orange" : "blue"
                return <Tag color={color}>{status}</Tag>
            }
        },
        {title: "Получатель", dataIndex: "recipient", render: (v) => v || "—"},
        {title: "Ошибка", dataIndex: "error", render: (v) => v || "—"},
        {title: "Дата", dataIndex: "createdAt"}
    ]

    return (
        <Space orientation="vertical" size={16} style={{width: "100%"}}>
            <SettingsTableSection
                title="Уведомления по статусам"
                subtitle="Настройка шаблонов уведомлений и аудит логов отправки."
                addButtonText="Добавить правило"
                onAdd={openCreate}
            >
                <Alert
                    type="info"
                    showIcon
                    message="Правило срабатывает при переходе заказа в выбранный статус."
                    description="Перед включением проверьте канал, получателя и переменные шаблона, чтобы не отправить клиенту неверный текст."
                    style={{margin: 16}}
                />
                <Table
                    rowKey="id"
                    loading={isLoadingConfigs}
                    dataSource={configs || []}
                    columns={configColumns}
                    pagination={false}
                    scroll={{x: 920}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Правила уведомлений ещё не настроены. Добавьте первое правило для важного статуса заказа."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <SettingsTableSection
                title="Логи уведомлений"
                subtitle="queued/sent/failed/skipped с причиной ошибки."
                addButtonText="Обновить"
                onAdd={() => undefined}
            >
                <Table
                    rowKey="id"
                    loading={isLoadingLogs}
                    dataSource={logs || []}
                    columns={logsColumns}
                    scroll={{x: 820}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Логов отправки пока нет. После первой попытки уведомления здесь появится статус и ошибка, если она случится."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editing ? "Редактировать правило уведомления" : "Создать правило уведомления"}
                open={isModalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={saveConfig}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={form} layout="vertical">
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
                        label="Шаблон"
                        extra="Используйте понятный текст и переменные заказа, например {{orderNumber}} и {{status}}."
                        rules={[{required: true}]}
                    >
                        <Input.TextArea rows={4} placeholder="{{orderNumber}} {{status}}" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default OrderNotificationsPage
