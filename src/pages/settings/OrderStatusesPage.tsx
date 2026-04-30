import {Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Space, Table, message} from "antd"
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
        {title: "Доступ", dataIndex: "access", render: (v) => v || "—"},
        {title: "Fixed", dataIndex: "fixed", render: (v) => (v ? "Да" : "Нет")},
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
                subtitle="CRUD статусов и настройка разрешённых переходов."
                addButtonText="Добавить статус"
                onAdd={openCreate}
            >
                <Table rowKey="id" loading={isLoading} dataSource={statuses || []} columns={columns} pagination={false} />
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
                <Form form={transitionForm} layout="vertical">
                    <Form.Item name="toStatusIds" label="Разрешённые переходы">
                        <Select mode="multiple" options={statusOptions} allowClear />
                    </Form.Item>
                    <Form.Item>
                        <Checkbox checked disabled>
                            Проверка переходов на backend обязательна
                        </Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default OrderStatusesPage
