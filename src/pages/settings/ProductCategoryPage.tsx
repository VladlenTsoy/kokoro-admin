import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch, Select} from "antd"
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "../../features/product-category/productCategoryApi.ts"
import type {ProductCategoryType} from "../../features/product-category/ProductCategoryTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

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
        {title: "Название", dataIndex: "title"},
        {title: "URL", dataIndex: "url"},
        {title: "Скрыта", dataIndex: "is_hide", render: (val: boolean) => (val ? "Да" : "Нет")},
        {
            title: "Действия",
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
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить категорию?" onConfirm={() => deleteCategory(record.id)}>
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
                title="Категории товаров"
                subtitle="Иерархия товарных категорий и видимость в каталоге."
                addButtonText="Добавить категорию"
                onAdd={() => {
                    setEditingCategory(null)
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
                title={editingCategory ? "Редактирование категории" : "Создание категории"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="parent_category_id" label="Родительская категория">
                        <Select allowClear placeholder="Выберите родительскую категорию">
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
                    <Form.Item name="is_hide" label="Скрыта" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductCategoryPage
