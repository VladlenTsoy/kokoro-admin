import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber} from "antd"
import {
    useGetStoragesQuery,
    useCreateStorageMutation,
    useUpdateStorageMutation,
    useDeleteStorageMutation
} from "../../features/settings/product-storage/productStorageApi.ts"
import type {ProductStorageType} from "../../features/settings/product-storage/productStorageTypes.ts"

const ProductStoragePage: React.FC = () => {
    const {data, isLoading} = useGetStoragesQuery()
    const [createStorage] = useCreateStorageMutation()
    const [updateStorage] = useUpdateStorageMutation()
    const [deleteStorage] = useDeleteStorageMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStorage, setEditingStorage] = useState<ProductStorageType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingStorage) {
            await updateStorage({id: editingStorage.id, body: values})
        } else {
            await createStorage(values)
        }
        setIsModalOpen(false)
        setEditingStorage(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id"},
        {title: "Title", dataIndex: "title"},
        {title: "Sales Point ID", dataIndex: "salesPointId"},
        {
            title: "Actions",
            render: (_: any, record: ProductStorageType) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingStorage(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm title="Delete product storage?" onConfirm={() => deleteStorage(record.id)}>
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
                    setEditingStorage(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Add Storage
            </Button>

            <Table
                loading={isLoading}
                dataSource={data || []}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingStorage ? "Edit Product Storage" : "Add Product Storage"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="salesPointId" label="Sales Point ID" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductStoragePage
