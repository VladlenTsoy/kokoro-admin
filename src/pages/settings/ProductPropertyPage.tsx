import {Alert, Button, Collapse, Divider, Empty, Form, Input, Modal, Popconfirm, Skeleton, Space, Switch, Tag, Typography, message} from "antd"
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
import {useMemo, useState} from "react"

const {Title, Text} = Typography

interface ProductPropertyFormValues {
    title: string
    description: string
    is_global: boolean
}

const ProductPropertyPage = () => {
    const {data, isLoading, isError} = useGetProductPropertiesQuery({isGlobal: 1}, {refetchOnMountOrArgChange: true})
    const [createProductProperty, {isLoading: isCreating}] = useCreateProductPropertyMutation()
    const [updateProductProperty, {isLoading: isUpdating}] = useUpdateProductPropertyMutation()
    const [deleteProductProperty, {isLoading: isDeleting}] = useDeleteProductPropertyMutation()
    const [form] = Form.useForm<ProductPropertyFormValues>()
    const [editingProperty, setEditingProperty] = useState<ProductPropertyType | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canCreate = useCan("catalog.create")
    const canUpdate = useCan("catalog.update")
    const canDelete = useCan("catalog.delete")

    const properties = useMemo(
        () => [...(data ?? [])].sort((a, b) => a.title.localeCompare(b.title, "ru") || a.id - b.id),
        [data]
    )

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

    const genExtra = (property: ProductPropertyType) => <Space size="middle">
        {canUpdate && (
            <EditOutlined onClick={(event) => {
                event.stopPropagation()
                openEdit(property)
            }} />
        )}
        {canDelete && (
            <Popconfirm
                title="Удалить свойство?"
                onConfirm={() => handleDelete(property.id)}
                okButtonProps={{loading: isDeleting}}
            >
                <DeleteOutlined
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                />
            </Popconfirm>
        )}
    </Space>

    return (
        <>
            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap"}}>
                <div>
                    <Title level={3} style={{marginBottom: 0}}>Свойства</Title>
                    <Text type="secondary">
                        Глобальные характеристики, которые менеджеры заполняют в карточках товаров. Проверяйте название и HTML-описание перед удалением.
                    </Text>
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
                    message="Как это влияет на каталог"
                    description="Свойства отсортированы по названию и показываются всем товарам. Перед удалением убедитесь, что менеджеры не используют это поле в описаниях и карточках."
                />
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить свойства"
                        description="Обновите страницу или проверьте доступ к настройкам каталога."
                    />
                )}
                {isLoading ? (
                    <Skeleton active paragraph={{rows: 4}} />
                ) : properties.length > 0 ? (
                    <Collapse
                        size="large"
                        items={properties.map(item => ({
                            key: item.id,
                            label: (
                                <Space wrap>
                                    <Text strong>{item.title}</Text>
                                    {item.is_global && <Tag color="blue">Глобальное</Tag>}
                                </Space>
                            ),
                            children: (
                                <Space direction="vertical" size={8} style={{width: "100%"}}>
                                    <Text type="secondary">Описание отображается как HTML в админке товара:</Text>
                                    <div dangerouslySetInnerHTML={{__html: item.description}} />
                                </Space>
                            ),
                            extra: genExtra(item)
                        }))}
                    />
                ) : (
                    <Empty
                        description="Глобальные свойства ещё не созданы"
                    >
                        {canCreate && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                Создать первое свойство
                            </Button>
                        )}
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
                <Form<ProductPropertyFormValues> form={form} layout="vertical" initialValues={{is_global: true}}>
                    <Form.Item
                        name="title"
                        label="Название"
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Материал" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Описание"
                        extra="Можно использовать короткое HTML-описание для подсказки менеджеру. Избегайте скриптов, внешних виджетов и длинных инструкций."
                        rules={[{required: true, message: "Введите описание"}]}
                    >
                        <Input.TextArea rows={4} placeholder="Например: <p>Укажите материал изделия.</p>" />
                    </Form.Item>
                    <Form.Item
                        name="is_global"
                        label="Глобальное"
                        valuePropName="checked"
                        extra="Глобальное свойство будет доступно во всех карточках товаров."
                    >
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductPropertyPage
