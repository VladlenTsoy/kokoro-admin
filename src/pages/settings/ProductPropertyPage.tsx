import DOMPurify from "dompurify"
import {Alert, Button, Collapse, Divider, Empty, Form, Input, Modal, Popconfirm, Space, Spin, Switch, Tag, Typography, message} from "antd"
import {
    useCreateProductPropertyMutation,
    useDeleteProductPropertyMutation,
    useGetProductPropertiesQuery,
    useUpdateProductPropertyMutation
} from "../../features/settings/product-property/productPropertyApi.ts"
import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons"
import type {ProductPropertyType} from "../../features/settings/product-property/ProductPropertyTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {useCan} from "../../features/auth/permissions.ts"
import {useState} from "react"

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
    const [deleteProductProperty, {isLoading: isDeleting}] = useDeleteProductPropertyMutation()
    const [form] = Form.useForm<ProductPropertyFormValues>()
    const [editingProperty, setEditingProperty] = useState<ProductPropertyType | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canCreate = useCan("catalog.create")
    const canUpdate = useCan("catalog.update")
    const canDelete = useCan("catalog.delete")

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingProperty(null)
        form.resetFields()
    }

    const openCreate = () => {
        setEditingProperty(null)
        form.setFieldsValue({
            title: "",
            description: "",
            is_global: true
        })
        setIsModalOpen(true)
    }

    const openEdit = (property: ProductPropertyType) => {
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
        try {
            await deleteProductProperty(id).unwrap()
            message.success("Свойство удалено")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const genExtra = (property: ProductPropertyType) => <Space size="middle" wrap>
        {canUpdate && (
            <EditOutlined
                aria-label={`Редактировать свойство ${property.title}`}
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
                okButtonProps={{loading: isDeleting}}
            >
                <DeleteOutlined
                    aria-label={`Удалить свойство ${property.title}`}
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                />
            </Popconfirm>
        )}
    </Space>

    const propertyItems = data?.map(item => ({
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
                ) : propertyItems?.length ? (
                    <Collapse size="large" items={propertyItems} />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Глобальные свойства ещё не созданы">
                        {canCreate ? <Button type="primary" onClick={openCreate}>Создать первое свойство</Button> : null}
                    </Empty>
                )}
            </Space>
            <Modal
                title={editingProperty ? "Редактировать свойство" : "Создать свойство"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
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
                        <Input placeholder="Материал" maxLength={120} showCount />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Описание"
                        extra="Можно оставить простое текстовое описание. Если используется HTML, он будет очищен перед показом."
                        rules={[{required: true, message: "Введите описание"}]}
                    >
                        <Input.TextArea rows={4} placeholder="Например: укажите основной материал и особенности ухода" />
                    </Form.Item>
                    <Form.Item
                        name="is_global"
                        label="Глобальное свойство"
                        valuePropName="checked"
                        extra="Включите, если это поле нужно показывать во всех карточках товаров."
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductPropertyPage
