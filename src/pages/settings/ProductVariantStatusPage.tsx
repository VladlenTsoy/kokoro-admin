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
    const {data, isLoading, isError, refetch} = useGetProductVariantStatusesQuery()
    const [createProductVariantStatus, {isLoading: isCreating}] = useCreateProductVariantStatusMutation()
    const [updateProductVariantStatus, {isLoading: isUpdating}] = useUpdateProductVariantStatusMutation()
    const [deleteProductVariantStatus, {isLoading: isDeleting}] = useDeleteProductVariantStatusMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProductVariantStatus, setEditingProductVariantStatus] = useState<ProductVariantStatusType | null>(null)
    const [deletingStatusId, setDeletingStatusId] = useState<number | null>(null)

    const [form] = Form.useForm()
    const isSavingStatus = isCreating || isUpdating
    const isMutatingStatus = isSavingStatus || isDeleting

    const statusSummary = useMemo(() => {
        const items = data ?? []
        return {
            total: items.length,
            defaultCount: items.filter((item) => item.is_default).length,
            withoutPosition: items.filter((item) => item.position === null || item.position === undefined).length
        }
    }, [data])

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

                return (
                    <Space wrap>
                        <Button
                            type="link"
                            disabled={isMutatingStatus}
                            onClick={() => {
                                setEditingProductVariantStatus(record)
                                form.setFieldsValue(record)
                                setIsModalOpen(true)
                            }}
                        >
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить статус варианта?"
                            description="Перед удалением убедитесь, что этот статус не используется в активных вариантах товара и фильтрах каталога. Действие нельзя отменить из админки."
                            okText={isCurrentStatusDeleting ? "Удаляем..." : "Удалить"}
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{loading: isCurrentStatusDeleting}}
                        >
                            <Button type="link" danger loading={isCurrentStatusDeleting} disabled={isDeleting && !isCurrentStatusDeleting}>
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
                addButtonDisabled={isMutatingStatus}
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
                </Space>
                <Table<ProductVariantStatusType>
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Статусы вариантов ещё не настроены. Добавьте первый статус, чтобы менеджеры понимали состояние SKU в каталоге."
                            />
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
