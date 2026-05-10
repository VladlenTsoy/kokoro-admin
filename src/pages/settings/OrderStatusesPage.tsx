import {Alert, Button, Checkbox, Empty, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message} from "antd"
import {useEffect, useMemo, useState} from "react"
import type {ColumnsType} from "antd/es/table"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import type {OrderStatusEntity} from "../../features/order-status/orderStatusTypes.ts"
import {
    useCreateOrderStatusMutation,
    useDeleteOrderStatusEntityMutation,
    useGetOrderStatusTransitionsQuery,
    useGetOrderStatusesQuery,
    useUpdateOrderStatusEntityMutation,
    useUpdateOrderStatusTransitionsMutation
} from "../../features/order-status/orderStatusApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const OrderStatusesPage = () => {
    const {data: statuses, isLoading} = useGetOrderStatusesQuery()
    const [createStatus, {isLoading: isCreating}] = useCreateOrderStatusMutation()
    const [updateStatus, {isLoading: isUpdating}] = useUpdateOrderStatusEntityMutation()
    const [deleteStatus] = useDeleteOrderStatusEntityMutation()
    const [updateTransitions, {isLoading: isUpdatingTransitions}] = useUpdateOrderStatusTransitionsMutation()

    const [isStatusModalOpen, setStatusModalOpen] = useState(false)
    const [isTransitionsModalOpen, setTransitionsModalOpen] = useState(false)
    const [editingStatus, setEditingStatus] = useState<OrderStatusEntity | null>(null)
    const [transitionStatus, setTransitionStatus] = useState<OrderStatusEntity | null>(null)

    const [statusForm] = Form.useForm<{title: string}>()
    const [transitionForm] = Form.useForm<{toStatusIds: number[]}>()

    const {data: transitions} = useGetOrderStatusTransitionsQuery(transitionStatus?.id ?? 0, {
        skip: !transitionStatus?.id
    })

    useEffect(() => {
        if (transitions && transitionStatus) {
            transitionForm.setFieldsValue({toStatusIds: transitions.map((item) => item.id)})
        }
    }, [transitionForm, transitions, transitionStatus])

    const statusOptions = useMemo(
        () => (statuses || []).filter((item) => item.id !== transitionStatus?.id).map((item) => ({label: item.title, value: item.id})),
        [statuses, transitionStatus]
    )

    const openCreate = () => {
        setEditingStatus(null)
        statusForm.resetFields()
        setStatusModalOpen(true)
    }

    const openEdit = (status: OrderStatusEntity) => {
        setEditingStatus(status)
        statusForm.setFieldsValue({title: status.title})
        setStatusModalOpen(true)
    }

    const saveStatus = async () => {
        try {
            const values = await statusForm.validateFields()
            if (editingStatus) {
                await updateStatus({id: editingStatus.id, body: values}).unwrap()
                message.success("Статус обновлён")
            } else {
                await createStatus(values).unwrap()
                message.success("Статус создан")
            }
            setStatusModalOpen(false)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const removeStatus = async (id: number) => {
        try {
            await deleteStatus(id).unwrap()
            message.success("Статус удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const saveTransitions = async () => {
        if (!transitionStatus) return
        try {
            const values = await transitionForm.validateFields()
            await updateTransitions({id: transitionStatus.id, toStatusIds: values.toStatusIds || []}).unwrap()
            message.success("Переходы статуса сохранены")
            setTransitionsModalOpen(false)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<OrderStatusEntity> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Название", dataIndex: "title"},
        {
            title: "Доступ",
            dataIndex: "access",
            render: (v) => v ? <Tag color="blue">{v}</Tag> : <Typography.Text type="secondary">без ограничения</Typography.Text>
        },
        {
            title: "Системный",
            dataIndex: "fixed",
            render: (v) => v ? <Tag color="gold">Защищён</Tag> : <Tag>Можно менять</Tag>
        },
        {title: "Позиция", dataIndex: "position", render: (v) => v ?? "—"},
        {
            title: "Действия",
            key: "actions",
            width: 280,
            render: (_, status) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(status)}>Редактировать</Button>
                    <Button type="link" onClick={() => {setTransitionStatus(status); setTransitionsModalOpen(true)}}>Переходы</Button>
                    <Popconfirm title="Удалить статус?" onConfirm={() => removeStatus(status.id)}>
                        <Button type="link" danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Статусы заказов"
                subtitle="Настройка статусов и разрешённых переходов: помогает менеджеру не перевести заказ в ошибочное состояние."
                addButtonText="Добавить статус"
                onAdd={openCreate}
            >
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={statuses || []}
                    columns={columns}
                    pagination={false}
                    scroll={{x: 760}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Статусы заказов пока не настроены"
                            >
                                <Button type="primary" onClick={openCreate}>Добавить первый статус</Button>
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingStatus ? "Редактировать статус" : "Создать статус"}
                open={isStatusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={saveStatus}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={statusForm} layout="vertical">
                    <Form.Item name="title" label="Название статуса" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={transitionStatus ? `Переходы для "${transitionStatus.title}"` : "Переходы"}
                open={isTransitionsModalOpen}
                onCancel={() => setTransitionsModalOpen(false)}
                onOk={saveTransitions}
                confirmLoading={isUpdatingTransitions}
            >
                <Space orientation="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Выберите только безопасные следующие статусы"
                        description="Эта настройка управляет доступными действиями менеджера в заказе. Если переход запрещён, менеджер не сможет случайно перескочить важный шаг."
                    />
                    <Form form={transitionForm} layout="vertical">
                        <Form.Item name="toStatusIds" label="Разрешённые переходы" extra="Оставьте пустым, если из этого статуса не должно быть ручных переходов.">
                            <Select mode="multiple" options={statusOptions} allowClear placeholder="Например: сборка, готов, отменён" />
                        </Form.Item>
                        <Form.Item>
                            <Checkbox checked disabled>
                                Проверка переходов на backend обязательна
                            </Checkbox>
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </>
    )
}

export default OrderStatusesPage
