import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch} from "antd"
import {
    useCreateProductVariantStatusMutation,
    useGetProductVariantStatusesQuery,
    useUpdateProductVariantStatusMutation,
    useDeleteProductVariantStatusMutation
} from "../../features/product-variant-status/productVariantStatusApi.ts"
import type {ProductVariantStatusType} from "../../features/product-variant-status/ProductVariantStatusType.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const ProductVariantStatusPage: React.FC = () => {
    const {data, isLoading} = useGetProductVariantStatusesQuery()
    const [createProductVariantStatus] = useCreateProductVariantStatusMutation()
    const [updateProductVariantStatus] = useUpdateProductVariantStatusMutation()
    const [deleteProductVariantStatus] = useDeleteProductVariantStatusMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProductVariantStatus, setEditingProductVariantStatus] = useState<ProductVariantStatusType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingProductVariantStatus) {
            await updateProductVariantStatus({id: editingProductVariantStatus.id, body: values})
        } else {
            await createProductVariantStatus(values)
        }
        setIsModalOpen(false)
        setEditingProductVariantStatus(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id"},
        {title: "Название", dataIndex: "title"},
        {
            title: "Действия",
            render: (_: any, record: ProductVariantStatusType) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingProductVariantStatus(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить статус?" onConfirm={() => deleteProductVariantStatus(record.id)}>
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Статусы вариантов товара"
                subtitle="Справочник статусов для жизненного цикла товарных вариантов."
                addButtonText="Добавить статус продукта"
                onAdd={() => {
                    setEditingProductVariantStatus(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Table
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                />
            </SettingsTableSection>

            <Modal
                title={editingProductVariantStatus ? "Изменить статус продукта" : "Создать статус продукта"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="position" label="Позиция" rules={[{required: false}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="is_default" label="По умолчанию" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductVariantStatusPage
