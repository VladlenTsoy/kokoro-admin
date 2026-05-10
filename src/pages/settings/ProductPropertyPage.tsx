import {Alert, Button, Collapse, Divider, Empty, Form, Input, Modal, Popconfirm, Skeleton, Space, Switch, Typography, message} from "antd"
import DOMPurify from "dompurify"
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
                description="Проверьте, что это свойство больше не нужно в карточках товаров. Действие нельзя быстро отменить."
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{loading: isDeleting, danger: true}}
                onConfirm={() => handleDelete(property.id)}
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
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
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
            <Space orientation="vertical" size={12} style={{width: "100%"}}>
                <Alert
                    type="info"
                    showIcon
                    message="Описание свойства показывается менеджерам в карточке товара"
                    description="Можно использовать простой текст или базовое форматирование. Потенциально опасный HTML очищается перед показом в админке."
                />
                {isLoading ? (
                    <Skeleton active paragraph={{rows: 4}} />
                ) : isError ? (
                    <Alert type="error" showIcon message="Не удалось загрузить свойства" description="Обновите страницу или попробуйте позже." />
                ) : (data?.length ?? 0) > 0 ? (
                    <Collapse
                        size="large"
                        items={data?.map(item => ({
                            key: item.id,
                            label: item.title,
                            children: <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.description)}} />,
                            extra: genExtra(item)
                        }))}
                    />
                ) : (
                    <Empty description="Глобальные свойства ещё не добавлены" />
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
                        rules={[{required: true, message: "Введите описание"}]}
                    >
                        <Input.TextArea rows={4} placeholder="Например: 100% хлопок, рекомендации по уходу или особенности посадки" />
                    </Form.Item>
                    <Form.Item name="is_global" label="Глобальное" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductPropertyPage
