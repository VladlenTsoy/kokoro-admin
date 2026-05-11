import {Alert, Button, Card, Checkbox, Empty, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message} from "antd"
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
    const {data: statuses, isLoading, isError, refetch} = useGetOrderStatusesQuery()
    const [createStatus, {isLoading: isCreating}] = useCreateOrderStatusMutation()
    const [updateStatus, {isLoading: isUpdating}] = useUpdateOrderStatusEntityMutation()
    const [deleteStatus] = useDeleteOrderStatusEntityMutation()
    const [updateTransitions, {isLoading: isUpdatingTransitions}] = useUpdateOrderStatusTransitionsMutation()

    const [isStatusModalOpen, setStatusModalOpen] = useState(false)
    const [isTransitionsModalOpen, setTransitionsModalOpen] = useState(false)
    const [editingStatus, setEditingStatus] = useState<OrderStatusEntity | null>(null)
    const [transitionStatus, setTransitionStatus] = useState<OrderStatusEntity | null>(null)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | "fixed" | "custom">("all")
    const [deletingStatusId, setDeletingStatusId] = useState<number | null>(null)

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

    const normalizedSearch = search.trim().toLowerCase()
    const statusSummary = useMemo(() => {
        const items = statuses || []
        return {
            total: items.length,
            fixed: items.filter((item) => item.fixed).length,
            custom: items.filter((item) => !item.fixed).length,
            withoutPosition: items.filter((item) => item.position === undefined || item.position === null).length
        }
    }, [statuses])

    const filteredStatuses = useMemo(() => {
        return (statuses || []).filter((status) => {
            const matchesSearch = !normalizedSearch || status.title.toLowerCase().includes(normalizedSearch) || String(status.id).includes(normalizedSearch) || (status.access || "").toLowerCase().includes(normalizedSearch)
            const matchesType = typeFilter === "all" || (typeFilter === "fixed" ? status.fixed : !status.fixed)
            return matchesSearch && matchesType
        })
    }, [normalizedSearch, statuses, typeFilter])

    const resetFilters = () => {
        setSearch("")
        setTypeFilter("all")
    }

    const hasActiveFilters = Boolean(normalizedSearch) || typeFilter !== "all"

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
        setDeletingStatusId(id)
        try {
            await deleteStatus(id).unwrap()
            message.success("Статус удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingStatusId(null)
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
        {
            title: "Статус заказа",
            dataIndex: "title",
            render: (title: string, status) => (
                <Space direction="vertical" size={2}>
                    <strong>{title}</strong>
                    <span style={{color: "rgba(0, 0, 0, 0.45)", fontSize: 12}}>
                        {status.fixed ? "Системный статус" : "Пользовательский статус"}
                        {status.access ? ` · доступ: ${status.access}` : ""}
                    </span>
                </Space>
            )
        },
        {
            title: "Тип",
            dataIndex: "fixed",
            width: 150,
            render: (value: boolean) => (
                <Tag color={value ? "blue" : "green"}>{value ? "Системный" : "Настраиваемый"}</Tag>
            )
        },
        {
            title: "Позиция",
            dataIndex: "position",
            width: 110,
            render: (value?: number) => value ?? "—"
        },
        {
            title: "Действия",
            key: "actions",
            width: 300,
            render: (_, status) => (
                <Space wrap>
                    <Button type="link" onClick={() => openEdit(status)}>Редактировать</Button>
                    <Button type="link" onClick={() => {setTransitionStatus(status); setTransitionsModalOpen(true)}}>Переходы</Button>
                    <Popconfirm
                        title="Удалить статус заказа?"
                        description="Перед удалением убедитесь, что статус не используется в заказах, фильтрах и отчётах. Для системных статусов безопаснее менять переходы, а не удалять запись."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => removeStatus(status.id)}
                    >
                        <Button type="link" danger loading={deletingStatusId === status.id}>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Статусы заказов"
                subtitle="Настройка статусов и разрешённых переходов, которые менеджеры видят в заказах, фильтрах и отчётах."
                addButtonText="Добавить статус"
                onAdd={openCreate}
            >
                <Alert
                    type="info"
                    showIcon
                    message="Подсказка для операционной команды"
                    description="Меняйте статусы маленькими шагами: название влияет на работу менеджеров, а переходы — на допустимый путь заказа. Перед удалением проверьте активные заказы и отчёты."
                    style={{margin: 16}}
                />
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить статусы заказов"
                        description="Повторите загрузку перед изменениями, чтобы не работать с устаревшими правилами обработки заказов."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        style={{margin: "0 16px 16px"}}
                    />
                )}
                <Space direction="vertical" size={16} style={{width: "100%", padding: "0 16px 16px"}}>
                    <Card size="small">
                        <Space direction="vertical" size={12} style={{width: "100%"}}>
                            <Space wrap size={[8, 8]}>
                                <Tag color="blue">Всего: {statusSummary.total}</Tag>
                                <Tag color="geekblue">Системных: {statusSummary.fixed}</Tag>
                                <Tag color="green">Настраиваемых: {statusSummary.custom}</Tag>
                                {statusSummary.withoutPosition > 0 && <Tag color="orange">Без позиции: {statusSummary.withoutPosition}</Tag>}
                                <Tag color={filteredStatuses.length === statusSummary.total ? "default" : "purple"}>Показано: {filteredStatuses.length}</Tag>
                            </Space>
                            <Space wrap style={{width: "100%"}}>
                                <Input.Search
                                    allowClear
                                    placeholder="Найти статус по названию, ID или access"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    style={{minWidth: 260, maxWidth: 380}}
                                />
                                <Select
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    style={{width: 190}}
                                    options={[
                                        {label: "Все типы", value: "all"},
                                        {label: "Системные", value: "fixed"},
                                        {label: "Настраиваемые", value: "custom"}
                                    ]}
                                />
                                {hasActiveFilters && <Button onClick={resetFilters}>Сбросить фильтры</Button>}
                            </Space>
                            <Typography.Text type="secondary">
                                Перед созданием нового статуса проверьте список: дубли в lifecycle заказа усложняют фильтры, отчёты и обучение менеджеров.
                            </Typography.Text>
                        </Space>
                    </Card>
                    <Table
                        rowKey="id"
                        loading={isLoading}
                        dataSource={filteredStatuses}
                        columns={columns}
                        pagination={false}
                        scroll={{x: 760}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasActiveFilters ? "По текущим фильтрам статусы не найдены. Сбросьте фильтры или проверьте другой ID/название." : "Статусы заказов ещё не настроены. Добавьте первый статус, чтобы менеджеры могли вести заказ по понятному сценарию."}
                                >
                                    {hasActiveFilters && <Button onClick={resetFilters}>Сбросить фильтры</Button>}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingStatus ? "Редактировать статус" : "Создать статус"}
                open={isStatusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={saveStatus}
                confirmLoading={isCreating || isUpdating}
                okText={editingStatus ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="Название статуса видно менеджерам и клиентским сценариям"
                    description="Используйте короткую формулировку действия или этапа заказа. После создания проверьте разрешённые переходы, чтобы менеджеры не застряли в сценарии обработки."
                    style={{marginBottom: 16}}
                />
                <Form form={statusForm} layout="vertical">
                    <Form.Item name="title" label="Название статуса" extra="Например: «Новый», «Собирается», «Передан курьеру»." rules={[{required: true, message: "Введите название статуса"}]}>
                        <Input placeholder="Новый" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={transitionStatus ? `Переходы для "${transitionStatus.title}"` : "Переходы"}
                open={isTransitionsModalOpen}
                onCancel={() => setTransitionsModalOpen(false)}
                onOk={saveTransitions}
                confirmLoading={isUpdatingTransitions}
                okText="Сохранить переходы"
                cancelText="Отмена"
            >
                <Alert
                    type="info"
                    showIcon
                    message="Переходы управляют следующим действием менеджера"
                    description="Оставьте только реальные следующие этапы заказа. Если переход нужен редко или рискован, лучше согласовать правило процесса перед включением."
                    style={{marginBottom: 16}}
                />
                <Form form={transitionForm} layout="vertical">
                    <Form.Item name="toStatusIds" label="Разрешённые переходы" extra="Менеджер сможет перевести заказ только в выбранные статусы.">
                        <Select mode="multiple" options={statusOptions} allowClear placeholder="Выберите допустимые следующие статусы" />
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
