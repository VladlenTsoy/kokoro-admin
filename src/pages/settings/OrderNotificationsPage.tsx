import {Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message} from "antd"
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

const typeOptions = ["sms", "email", "push", "telegram", "webhook"].map((value) => ({label: value, value}))
const sendToOptions = ["client", "manager", "courier", "admin"].map((value) => ({label: value, value}))

type FormValues = {
    statusId: number
    type: "sms" | "email" | "push" | "telegram" | "webhook"
    sendTo: "client" | "manager" | "courier" | "admin"
    template: string
    isActive: boolean
}

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
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Статус", dataIndex: "statusId", render: (id: number) => statusMap.get(id) || id},
        {title: "Тип", dataIndex: "type"},
        {title: "Кому", dataIndex: "sendTo"},
        {title: "Активен", dataIndex: "isActive", render: (v) => (v ? "Да" : "Нет")},
        {title: "Template", dataIndex: "template", render: (v) => (v.length > 45 ? `${v.slice(0, 45)}...` : v)},
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, item) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(item)}>Редактировать</Button>
                    <Popconfirm title="Удалить конфиг?" onConfirm={() => removeConfig(item.id)}>
                        <Button type="link" danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    const logsColumns: ColumnsType<OrderStatusNotificationLog> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Order", dataIndex: "orderId", width: 90},
        {
            title: "Статус",
            dataIndex: "status",
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
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <SettingsTableSection
                title="Уведомления по статусам"
                subtitle="Настройка шаблонов уведомлений и аудит логов отправки."
                addButtonText="Добавить правило"
                onAdd={openCreate}
            >
                <Table rowKey="id" loading={isLoadingConfigs} dataSource={configs || []} columns={configColumns} pagination={false} />
            </SettingsTableSection>

            <SettingsTableSection
                title="Логи уведомлений"
                subtitle="queued/sent/failed/skipped с причиной ошибки."
                addButtonText="Обновить"
                onAdd={() => undefined}
            >
                <Table rowKey="id" loading={isLoadingLogs} dataSource={logs || []} columns={logsColumns} />
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
                    <Form.Item name="template" label="Шаблон" rules={[{required: true}]}>
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
