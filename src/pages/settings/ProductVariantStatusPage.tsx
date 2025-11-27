import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch} from "antd"
import {
    useCreateProductVariantStatusMutation,
    useGetProductVariantStatusesQuery,
    useUpdateProductVariantStatusMutation,
    useDeleteProductVariantStatusMutation
} from "../../features/product-variant-status/productVariantStatusApi.ts"
import type {ProductVariantStatusType} from "../../features/product-variant-status/ProductVariantStatusType.ts"

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
        {title: "Title", dataIndex: "title"},
        {
            title: "Actions",
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
                        Edit
                    </Button>
                    <Popconfirm title="Delete source?" onConfirm={() => deleteProductVariantStatus(record.id)}>
                        <Button type="link" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <Button
                type="primary"
                style={{marginBottom: 16}}
                onClick={() => {
                    setEditingProductVariantStatus(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Добавить статус продукта
            </Button>

            <Table
                loading={isLoading}
                dataSource={data || []}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingProductVariantStatus ? "Изменить статус продукта" : "Создать статус продукта"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="position" label="Позиция" rules={[{required: false}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="is_default" label="Active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductVariantStatusPage
