import DOMPurify from "dompurify"
import {Alert, Button, Collapse, Divider, Empty, Form, Input, Modal, Popconfirm, Space, Spin, Switch, Tag, Typography, message} from "antd"
import {
    useCreateProductPropertyMutation,
    useDeleteProductPropertyMutation,
    useGetProductPropertiesQuery,
    useUpdateProductPropertyMutation
} from "../../features/settings/product-property/productPropertyApi.ts"
import {DeleteOutlined, EditOutlined, LoadingOutlined, PlusOutlined} from "@ant-design/icons"
import type {ProductPropertyType} from "../../features/settings/product-property/ProductPropertyTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {useCan} from "../../features/auth/permissions.ts"
import {useMemo, useState} from "react"

const {Title, Text} = Typography

interface ProductPropertyFormValues {
    title: string
    description: string
    is_global: boolean
}

const ProductPropertyPage = () => {
    const {data, isLoading, isError, refetch} = useGetProductPropertiesQuery(
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
    const normalizedSearchText = searchText.trim().toLowerCase()

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
        if (deletingPropertyId !== null || isSaving) return

        setEditingProperty(null)
        form.setFieldsValue({
            title: "",
            description: "",
            is_global: true
        })
        setIsModalOpen(true)
    }

    const openEdit = (property: ProductPropertyType) => {
        if (deletingPropertyId !== null || isSaving) return

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

    const genExtra = (property: ProductPropertyType) => {
        const isDeletingCurrentProperty = deletingPropertyId === property.id
        const isAnotherPropertyDeleting = deletingPropertyId !== null && !isDeletingCurrentProperty

        return <Space size="middle" wrap>
            {canUpdate && (
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    aria-label={`Редактировать свойство ${property.title}`}
                    disabled={deletingPropertyId !== null || isSaving}
                    onClick={(event) => {
                        event.stopPropagation()
                        openEdit(property)
                    }}
                />
            )}
            {canDelete && (
                <Popconfirm
                    title="Удалить свойство?"
                    description="Проверьте, что свойство не используется в карточках товаров или на витрине. Действие нельзя отменить из админки."
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDelete(property.id)}
                    okButtonProps={{loading: isDeletingCurrentProperty, danger: true}}
                    disabled={isAnotherPropertyDeleting}
                >
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={isDeletingCurrentProperty ? <LoadingOutlined /> : <DeleteOutlined />}
                        aria-label={isDeletingCurrentProperty ? `Удаляем свойство ${property.title}` : `Удалить свойство ${property.title}`}
                        loading={isDeletingCurrentProperty}
                        disabled={isAnotherPropertyDeleting}
                        onClick={(event) => {
                            event.stopPropagation()
                        }}
                    />
                </Popconfirm>
            )}
        </Space>
    }

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
                {canCreate && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={deletingPropertyId !== null || isSaving}>
                        Создать свойство
                    </Button>
                )}
            </div>
            <Divider size="middle" />
            <Space direction="vertical" size={12} style={{width: "100%"}}>
                <Alert
                    type="info"
                    showIcon
                    message="Свойства помогают менеджерам одинаково заполнять карточки товаров"
                    description="Используйте понятные названия и короткие описания. HTML в описании очищается перед показом, но перед публикацией всё равно проверяйте, что текст выглядит корректно на витрине."
                />
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
                        {canCreate ? <Button type="primary" onClick={openCreate} disabled={deletingPropertyId !== null || isSaving}>Создать первое свойство</Button> : null}
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
