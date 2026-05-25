import DOMPurify from "dompurify"
import {Alert, Button, Collapse, Divider, Empty, Form, Input, Modal, Popconfirm, Space, Spin, Switch, Tag, Tooltip, Typography, message} from "antd"
import {
    useCreateProductPropertyMutation,
    useDeleteProductPropertyMutation,
    useGetProductPropertiesQuery,
    useUpdateProductPropertyMutation
} from "../../features/settings/product-property/productPropertyApi.ts"
import {DeleteOutlined, EditOutlined, LoadingOutlined, PlusOutlined} from "@ant-design/icons"
import type {ProductPropertyType} from "../../features/settings/product-property/ProductPropertyTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"
import {useCan} from "../../features/auth/permissions.ts"
import {useMemo, useState} from "react"

const {Title, Text} = Typography

interface ProductPropertyFormValues {
    title: string
    description: string
    is_global: boolean
}

const ProductPropertyPage = () => {
    const {data, isLoading, isFetching, isError, refetch} = useGetProductPropertiesQuery(
        {isGlobal: 1},
        {refetchOnMountOrArgChange: true}
    )
    const [createProductProperty, {isLoading: isCreating}] = useCreateProductPropertyMutation()
    const [updateProductProperty, {isLoading: isUpdating}] = useUpdateProductPropertyMutation()
    const [deleteProductProperty] = useDeleteProductPropertyMutation()
    const [form] = Form.useForm<ProductPropertyFormValues>()
    const [editingProperty, setEditingProperty] = useState<ProductPropertyType | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchText, setSearchText] = useState("")
    const [deletingPropertyId, setDeletingPropertyId] = useState<number | null>(null)
    const canCreate = useCan("catalog.create")
    const canUpdate = useCan("catalog.update")
    const canDelete = useCan("catalog.delete")
    const isSaving = isCreating || isUpdating
    const isListConfirmed = !isLoading && !isFetching && !isError && Array.isArray(data)
    const isPropertyActionBlocked = !isListConfirmed || deletingPropertyId !== null || isSaving
    const normalizedSearchText = searchText.trim().toLowerCase()

    const blockedActionReason = (() => {
        if (isSaving) return "Дождитесь завершения сохранения свойства."
        if (deletingPropertyId !== null) return "Дождитесь завершения удаления свойства."
        if (isLoading) return "Список свойств ещё загружается."
        if (isFetching) return "Список свойств обновляется — дождитесь подтверждённых данных."
        if (isError) return "Не удалось подтвердить актуальный список свойств. Нажмите «Повторить» перед изменениями."
        if (!Array.isArray(data)) return "Список свойств пока не подтверждён API."

        return undefined
    })()

    const summary = useMemo(() => {
        const properties = data ?? []

        return {
            total: properties.length,
            global: properties.filter((property) => property.is_global).length,
            local: properties.filter((property) => !property.is_global).length
        }
    }, [data])

    const filteredProperties = useMemo(() => {
        const properties = [...(data ?? [])].sort((a, b) => a.title.localeCompare(b.title, "ru") || a.id - b.id)

        if (!normalizedSearchText) {
            return properties
        }

        return properties.filter((property) => {
            const searchableText = [property.title, property.description, String(property.id)].join(" ").toLowerCase()

            return searchableText.includes(normalizedSearchText)
        })
    }, [data, normalizedSearchText])

    const closeModal = () => {
        if (isSaving) return

        setIsModalOpen(false)
        setEditingProperty(null)
        form.resetFields()
    }

    const openCreate = () => {
        if (isPropertyActionBlocked) return

        setEditingProperty(null)
        form.setFieldsValue({
            title: "",
            description: "",
            is_global: true
        })
        setIsModalOpen(true)
    }

    const openEdit = (property: ProductPropertyType) => {
        if (isPropertyActionBlocked) return

        setEditingProperty(property)
        form.setFieldsValue({
            title: property.title,
            description: property.description,
            is_global: property.is_global
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingProperty) {
                await updateProductProperty({id: editingProperty.id, data: values}).unwrap()
                message.success("Свойство обновлено")
            } else {
                await createProductProperty(values).unwrap()
                message.success("Свойство создано")
            }

            closeModal()
        } catch (error) {
            if (isAntdFormValidationError(error)) return

            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingPropertyId(id)
        try {
            await deleteProductProperty(id).unwrap()
            message.success("Свойство удалено")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingPropertyId(null)
        }
    }

    const getPropertyActionContext = (property: ProductPropertyType) => {
        const scopeLabel = property.is_global ? "глобальное свойство" : "локальное свойство"
        const hasDescription = DOMPurify.sanitize(property.description, {ALLOWED_TAGS: [], ALLOWED_ATTR: []}).trim().length > 0
        const descriptionLabel = hasDescription ? "описание заполнено" : "описание пустое"

        return `«${property.title}», ID ${property.id}, ${scopeLabel}, ${descriptionLabel}`
    }

    const genExtra = (property: ProductPropertyType) => {
        const isDeletingCurrentProperty = deletingPropertyId === property.id
        const isAnotherPropertyDeleting = deletingPropertyId !== null && !isDeletingCurrentProperty
        const isDeleteDisabled = !isListConfirmed || isSaving || isAnotherPropertyDeleting
        const isEditDisabled = isPropertyActionBlocked
        const propertyActionContext = getPropertyActionContext(property)
        const editPropertyLabel = `Редактировать свойство ${propertyActionContext}`
        const deletePropertyLabel = isDeletingCurrentProperty ? `Удаляем свойство ${propertyActionContext}` : `Удалить свойство ${propertyActionContext}`

        return <Space size="middle" wrap>
            {canUpdate && (
                <Tooltip title={isEditDisabled ? blockedActionReason : undefined}>
                    <span onClick={(event) => event.stopPropagation()}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            aria-label={editPropertyLabel}
                            title={editPropertyLabel}
                            disabled={isEditDisabled}
                            onClick={(event) => {
                                event.stopPropagation()
                                openEdit(property)
                            }}
                        />
                    </span>
                </Tooltip>
            )}
            {canDelete && (
                <Tooltip title={isDeleteDisabled && !isDeletingCurrentProperty ? blockedActionReason : undefined}>
                    <span onClick={(event) => event.stopPropagation()}>
                        <Popconfirm
                            title={`Удалить свойство ${propertyActionContext}?`}
                            description="Проверьте, что именно это свойство не используется в карточках товаров или на витрине. Действие нельзя отменить из админки."
                            okText="Удалить"
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(property.id)}
                            okButtonProps={{loading: isDeletingCurrentProperty, danger: true}}
                            disabled={isDeleteDisabled}
                        >
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={isDeletingCurrentProperty ? <LoadingOutlined /> : <DeleteOutlined />}
                                aria-label={deletePropertyLabel}
                                title={deletePropertyLabel}
                                loading={isDeletingCurrentProperty}
                                disabled={isDeleteDisabled}
                                onClick={(event) => {
                                    event.stopPropagation()
                                }}
                            />
                        </Popconfirm>
                    </span>
                </Tooltip>
            )}
        </Space>
    }

    const createPropertyButton = (
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={isPropertyActionBlocked}>
            Создать свойство
        </Button>
    )
    const createPropertyAction = isPropertyActionBlocked && blockedActionReason ? (
        <Tooltip title={blockedActionReason}>
            <span>{createPropertyButton}</span>
        </Tooltip>
    ) : createPropertyButton

    const propertyItems = filteredProperties.map(item => ({
        key: item.id,
        label: (
            <Space direction="vertical" size={2}>
                <Space size={8} wrap>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Tag color="blue">ID {item.id}</Tag>
                    {item.is_global ? <Tag color="green">Глобальное</Tag> : <Tag>Локальное</Tag>}
                </Space>
                <Text type="secondary">Показывается менеджеру в карточке товара и может влиять на описание на витрине</Text>
            </Space>
        ),
        children: (
            <Space direction="vertical" size={8} style={{width: "100%"}}>
                <Text type="secondary">Предпросмотр описания с безопасной очисткой HTML:</Text>
                <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.description)}} />
            </Space>
        ),
        extra: genExtra(item)
    }))

    return (
        <>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap"}}>
                <div>
                    <Title level={3} style={{marginBottom: 0}}>Свойства</Title>
                    <Text type="secondary">Добавленное здесь свойство отображается на всех товарах.</Text>
                </div>
                {canCreate ? createPropertyAction : null}
            </div>
            <Divider size="middle" />
            <Space direction="vertical" size={12} style={{width: "100%"}}>
                <Alert
                    type="info"
                    showIcon
                    message="Свойства помогают менеджерам одинаково заполнять карточки товаров"
                    description="Используйте понятные названия и короткие описания. HTML в описании очищается перед показом, но перед публикацией всё равно проверяйте, что текст выглядит корректно на витрине."
                />
                {canCreate && isPropertyActionBlocked && blockedActionReason ? (
                    <Alert
                        type={isError || deletingPropertyId !== null || isSaving ? "warning" : "info"}
                        showIcon
                        message="Создание свойства временно недоступно"
                        description={blockedActionReason}
                    />
                ) : null}
                <Space size={8} wrap>
                    <Tag color="blue">Всего: {summary.total}</Tag>
                    <Tag color="green">Глобальных: {summary.global}</Tag>
                    <Tag>Локальных: {summary.local}</Tag>
                    {normalizedSearchText ? <Tag color="purple">Найдено: {filteredProperties.length}</Tag> : null}
                </Space>
                <Input.Search
                    allowClear
                    enterButton="Найти"
                    placeholder="Найти по названию, описанию или ID перед созданием дубля"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    onSearch={(value) => setSearchText(value)}
                />
                {deletingPropertyId !== null ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Удаляем свойство каталога"
                        description="Дождитесь завершения операции: создание, редактирование и удаление других свойств временно заблокированы, чтобы не смешать изменения справочника."
                    />
                ) : null}
                {isFetching && !isLoading ? (
                    <Alert
                        type="info"
                        showIcon
                        message="Обновляем список свойств"
                        description="Действия создания, редактирования и удаления временно заблокированы, пока API не подтвердит актуальный справочник."
                    />
                ) : null}
                {isError ? (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить свойства"
                        description="Не меняйте свойства вслепую: повторите загрузку или передайте проблему администратору, если ошибка сохраняется."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                    />
                ) : null}
                {isLoading ? (
                    <div style={{padding: 32, textAlign: "center"}}>
                        <Spin />
                        <div style={{marginTop: 12}}>
                            <Text type="secondary">Загружаем свойства каталога…</Text>
                        </div>
                    </div>
                ) : propertyItems.length ? (
                    <Collapse size="large" items={propertyItems} />
                ) : normalizedSearchText ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="По этим условиям свойства не найдены">
                        <Space direction="vertical" size={8}>
                            <Text type="secondary">Сбросьте поиск или проверьте существующие свойства перед созданием нового.</Text>
                            <Button onClick={() => setSearchText("")}>Сбросить поиск</Button>
                        </Space>
                    </Empty>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Глобальные свойства ещё не созданы">
                        {canCreate ? createPropertyAction : null}
                    </Empty>
                )}
            </Space>
            <Modal
                title={editingProperty ? "Редактировать свойство" : "Создать свойство"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                confirmLoading={isSaving}
                okText={isSaving ? "Сохраняем…" : editingProperty ? "Сохранить" : "Создать"}
                okButtonProps={{disabled: isSaving}}
                cancelButtonProps={{disabled: isSaving}}
                maskClosable={!isSaving}
                keyboard={!isSaving}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Описание увидят менеджеры при заполнении каталога"
                    description="Держите текст коротким и прикладным: что именно указать, в каком формате и где это увидит клиент. Не вставляйте скрипты или сторонние виджеты."
                />
                <Form<ProductPropertyFormValues> form={form} layout="vertical" initialValues={{is_global: true}}>
                    <Form.Item
                        name="title"
                        label="Название"
                        extra="Короткое название для менеджера: материал, уход, состав, посадка."
                        rules={[
                            {required: true, message: "Введите название"},
                            {max: 120, message: "Максимум 120 символов"}
                        ]}
                    >
                        <Input placeholder="Материал" maxLength={120} showCount disabled={isSaving} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Описание"
                        extra="Можно оставить простое текстовое описание. Если используется HTML, он будет очищен перед показом."
                        rules={[{required: true, message: "Введите описание"}]}
                    >
                        <Input.TextArea rows={4} placeholder="Например: укажите основной материал и особенности ухода" disabled={isSaving} />
                    </Form.Item>
                    <Form.Item
                        name="is_global"
                        label="Глобальное свойство"
                        valuePropName="checked"
                        extra="Включите, если это поле нужно показывать во всех карточках товаров."
                    >
                        <Switch disabled={isSaving} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductPropertyPage
