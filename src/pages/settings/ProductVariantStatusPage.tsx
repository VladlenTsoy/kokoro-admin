import React, {useMemo, useState} from "react"
import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useCreateProductVariantStatusMutation,
    useGetProductVariantStatusesQuery,
    useUpdateProductVariantStatusMutation,
    useDeleteProductVariantStatusMutation
} from "../../features/product-variant-status/productVariantStatusApi.ts"
import type {ProductVariantStatusType} from "../../features/product-variant-status/ProductVariantStatusType.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const ProductVariantStatusPage: React.FC = () => {
    const {data, isLoading, isFetching, isError, refetch} = useGetProductVariantStatusesQuery()
    const [createProductVariantStatus, {isLoading: isCreating}] = useCreateProductVariantStatusMutation()
    const [updateProductVariantStatus, {isLoading: isUpdating}] = useUpdateProductVariantStatusMutation()
    const [deleteProductVariantStatus, {isLoading: isDeleting}] = useDeleteProductVariantStatusMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProductVariantStatus, setEditingProductVariantStatus] = useState<ProductVariantStatusType | null>(null)
    const [deletingStatusId, setDeletingStatusId] = useState<number | null>(null)
    const [statusSearch, setStatusSearch] = useState("")

    const [form] = Form.useForm()
    const isSavingStatus = isCreating || isUpdating
    const isMutatingStatus = isSavingStatus || isDeleting
    const isStatusListUnsafe = isLoading || isFetching || isError || !data
    const areStatusActionsBlocked = isStatusListUnsafe || isMutatingStatus
    const statuses = useMemo(() => data ?? [], [data])
    const statusActionsDisabledReason = useMemo(() => {
        if (isLoading) {
            return "Ждём первичную загрузку статусов вариантов, чтобы не создать правило в пустом справочнике."
        }
        if (isFetching) {
            return "Обновляем список статусов. Дождитесь свежих данных перед изменением жизненного цикла SKU."
        }
        if (isError || !data) {
            return "Справочник статусов не подтверждён API. Повторите загрузку перед созданием, редактированием или удалением."
        }
        if (isSavingStatus) {
            return "Сохраняем статус варианта. Новые изменения доступны после ответа API."
        }
        if (isDeleting) {
            return "Удаляем статус варианта. Дождитесь завершения, чтобы не смешать изменения справочника."
        }

        return undefined
    }, [data, isDeleting, isError, isFetching, isLoading, isSavingStatus])
    const normalizedStatusSearch = statusSearch.trim().toLowerCase()
    const hasStatusSearch = normalizedStatusSearch.length > 0
    const filteredStatuses = useMemo(
        () => normalizedStatusSearch
            ? statuses.filter((status) =>
                status.title.toLowerCase().includes(normalizedStatusSearch)
                || String(status.id).includes(normalizedStatusSearch)
                || (status.is_default ? "основной default по умолчанию" : "нет").includes(normalizedStatusSearch)
            )
            : statuses,
        [normalizedStatusSearch, statuses]
    )

    const statusSummary = useMemo(() => ({
        total: statuses.length,
        defaultCount: statuses.filter((item) => item.is_default).length,
        withoutPosition: statuses.filter((item) => item.position === null || item.position === undefined).length
    }), [statuses])

    const closeModal = () => {
        if (isSavingStatus) {
            return
        }

        setIsModalOpen(false)
        setEditingProductVariantStatus(null)
        form.resetFields()
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            if (editingProductVariantStatus) {
                await updateProductVariantStatus({id: editingProductVariantStatus.id, body: values}).unwrap()
                message.success("Статус варианта обновлён")
            } else {
                await createProductVariantStatus(values).unwrap()
                message.success("Статус варианта создан")
            }
            closeModal()
        } catch (error) {
            if (error && typeof error === "object" && "errorFields" in error) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingStatusId(id)
        try {
            await deleteProductVariantStatus(id).unwrap()
            message.success("Статус варианта удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingStatusId(null)
        }
    }

    const columns: ColumnsType<ProductVariantStatusType> = [
        {title: "ID", dataIndex: "id", width: 90},
        {
            title: "Статус варианта",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <strong>{title}</strong>
                    <span style={{color: "rgba(0, 0, 0, 0.45)", fontSize: 12}}>Позиция: {record.position ?? "не задана"}</span>
                </Space>
            )
        },
        {
            title: "По умолчанию",
            dataIndex: "is_default",
            width: 160,
            render: (isDefault: boolean) => (
                <Tag color={isDefault ? "blue" : "default"}>{isDefault ? "Да, основной" : "Нет"}</Tag>
            )
        },
        {
            title: "Действия",
            width: 220,
            render: (_: unknown, record: ProductVariantStatusType) => {
                const isCurrentStatusDeleting = deletingStatusId === record.id
                const defaultStatusLabel = record.is_default ? "основной статус по умолчанию" : "не основной статус"
                const positionLabel = record.position === null || record.position === undefined
                    ? "позиция не задана"
                    : `позиция ${record.position}`
                const statusContext = `«${record.title}», ID ${record.id}, ${defaultStatusLabel}, ${positionLabel}`
                const editStatusLabel = `Редактировать статус варианта ${statusContext}`
                const deleteStatusLabel = isCurrentStatusDeleting
                    ? `Удаляем статус варианта ${statusContext}`
                    : `Удалить статус варианта ${statusContext}`
                const editActionTitle = statusActionsDisabledReason || editStatusLabel
                const deleteActionTitle = statusActionsDisabledReason || deleteStatusLabel

                return (
                    <Space wrap>
                        <Button
                            type="link"
                            disabled={areStatusActionsBlocked}
                            onClick={() => {
                                setEditingProductVariantStatus(record)
                                form.setFieldsValue(record)
                                setIsModalOpen(true)
                            }}
                            aria-label={editStatusLabel}
                            title={editActionTitle}
                        >
                            Редактировать
                        </Button>
                        <Popconfirm
                            title={`Удалить статус варианта «${record.title}»?`}
                            description={`Статус ID ${record.id}: ${defaultStatusLabel}, ${positionLabel}. Перед удалением убедитесь, что он не используется в активных вариантах товара и фильтрах каталога. Действие нельзя отменить из админки.`}
                            okText={isCurrentStatusDeleting ? "Удаляем..." : "Удалить"}
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{loading: isCurrentStatusDeleting}}
                            disabled={areStatusActionsBlocked && !isCurrentStatusDeleting}
                        >
                            <Button
                                type="link"
                                danger
                                loading={isCurrentStatusDeleting}
                                disabled={areStatusActionsBlocked && !isCurrentStatusDeleting}
                                aria-label={deleteStatusLabel}
                                title={deleteActionTitle}
                            >
                                {isCurrentStatusDeleting ? "Удаляем..." : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Статусы вариантов товара"
                subtitle="Справочник статусов для жизненного цикла товарных вариантов: доступность, витрина, складские состояния."
                addButtonText="Добавить статус варианта"
                addButtonDisabled={areStatusActionsBlocked}
                addButtonDisabledReason={statusActionsDisabledReason}
                onAdd={() => {
                    setEditingProductVariantStatus(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить статусы вариантов"
                        description="Проверьте подключение или повторите загрузку, чтобы не менять справочник вслепую."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        style={{margin: 16}}
                    />
                )}
                <Space direction="vertical" size={12} style={{width: "100%", padding: "16px 16px 0"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Подсказка для менеджеров каталога"
                        description="Статус по умолчанию подставляется новым вариантам. Меняйте порядок и основной статус аккуратно: это влияет на скорость публикации и фильтрацию товаров."
                    />
                    {!isLoading && !isError ? (
                        <Alert
                            type={statusSummary.defaultCount === 1 && statusSummary.withoutPosition === 0 ? "success" : "warning"}
                            showIcon
                            message="Сводка справочника статусов вариантов"
                            description={(
                                <Space direction="vertical" size={2}>
                                    <Typography.Text>Всего статусов: {statusSummary.total}; по умолчанию: {statusSummary.defaultCount}; без позиции: {statusSummary.withoutPosition}.</Typography.Text>
                                    <Typography.Text type="secondary">
                                        Для предсказуемой работы каталога держите ровно один основной статус и задавайте позиции всем рабочим статусам.
                                    </Typography.Text>
                                </Space>
                            )}
                        />
                    ) : null}
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Поиск по названию, ID или основному статусу"
                            value={statusSearch}
                            onChange={(event) => setStatusSearch(event.target.value)}
                            onSearch={setStatusSearch}
                            style={{width: 340, maxWidth: "100%"}}
                        />
                        <Tag color="blue">Всего: {statusSummary.total}</Tag>
                        {hasStatusSearch ? <Tag>Найдено: {filteredStatuses.length}</Tag> : null}
                        {hasStatusSearch ? <Button onClick={() => setStatusSearch("")}>Сбросить поиск</Button> : null}
                    </Space>
                </Space>
                <Table<ProductVariantStatusType>
                    loading={isLoading}
                    dataSource={filteredStatuses}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={hasStatusSearch
                                    ? "Статусы вариантов по поиску не найдены"
                                    : "Статусы вариантов ещё не настроены. Добавьте первый статус, чтобы менеджеры понимали состояние SKU в каталоге."}
                            >
                                {hasStatusSearch ? (
                                    <Button onClick={() => setStatusSearch("")}>Сбросить поиск</Button>
                                ) : null}
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingProductVariantStatus ? "Изменить статус варианта" : "Создать статус варианта"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                okText={isSavingStatus ? "Сохраняем..." : editingProductVariantStatus ? "Сохранить" : "Создать"}
                cancelText="Отмена"
                confirmLoading={isSavingStatus}
                cancelButtonProps={{disabled: isSavingStatus}}
                closable={!isSavingStatus}
                maskClosable={!isSavingStatus}
                keyboard={!isSavingStatus}
            >
                <Alert
                    type={isSavingStatus ? "info" : "warning"}
                    showIcon
                    message={isSavingStatus ? "Сохраняем статус варианта" : "Статус влияет на работу каталога"}
                    description={isSavingStatus
                        ? "Дождитесь ответа API: поля временно заблокированы, чтобы не отправить смешанные правила SKU."
                        : "Не удаляйте и не переименовывайте рабочие статусы без проверки активных вариантов товара и витринных фильтров."}
                    style={{marginBottom: 16}}
                />
                <Form form={form} layout="vertical" initialValues={{is_default: false}} disabled={isSavingStatus}>
                    <Form.Item name="title" label="Название" rules={[{required: true, message: "Введите название статуса"}]}>
                        <Input placeholder="Например, В наличии" />
                    </Form.Item>
                    <Form.Item name="position" label="Позиция" extra="Меньшее число поднимает статус выше в списках и селектах.">
                        <InputNumber min={0} style={{width: "100%"}} placeholder="10" />
                    </Form.Item>
                    <Form.Item name="is_default" label="По умолчанию" valuePropName="checked" extra="Используйте только для статуса, который безопасно назначать новым вариантам товара.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductVariantStatusPage
