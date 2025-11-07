import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch, Select} from "antd"
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "../../features/product-category/productCategoryApi.ts"
import type {ProductCategoryType} from "../../features/product-category/ProductCategoryTypes.ts"

const ProductCategoryPage: React.FC = () => {
    const {data, isLoading} = useGetCategoriesQuery()
    const [createCategory] = useCreateCategoryMutation()
    const [updateCategory] = useUpdateCategoryMutation()
    const [deleteCategory] = useDeleteCategoryMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ProductCategoryType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingCategory) {
            await updateCategory({id: editingCategory.id, body: values})
        } else {
            await createCategory(values)
        }
        setIsModalOpen(false)
        setEditingCategory(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id"},
        {title: "Title", dataIndex: "title"},
        {title: "URL", dataIndex: "url"},
        {title: "Hidden", dataIndex: "is_hide", render: (val: boolean) => (val ? "Yes" : "No")},
        {
            title: "Actions",
            render: (_: any, record: ProductCategoryType) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingCategory(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(record.id)}>
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
                    setEditingCategory(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Add Category
            </Button>

            <Table
                loading={isLoading}
                dataSource={data || []}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingCategory ? "Edit Category" : "Add Category"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="parent_category_id" label="Parent Category">
                        <Select allowClear placeholder="Select parent">
                            {(data || []).map((cat) => (
                                <Select.Option key={cat.id} value={cat.id}>
                                    {cat.title}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="url" label="URL" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="is_hide" label="Hidden" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductCategoryPage
