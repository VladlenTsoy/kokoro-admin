import React, {useMemo, useState} from "react"
import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "../../features/product-category/productCategoryApi.ts"
import type {ProductCategoryType} from "../../features/product-category/ProductCategoryTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const ProductCategoryPage: React.FC = () => {
    const {data, isLoading} = useGetCategoriesQuery()
    const [createCategory, {isLoading: isCreating}] = useCreateCategoryMutation()
    const [updateCategory, {isLoading: isUpdating}] = useUpdateCategoryMutation()
    const [deleteCategory, {isLoading: isDeleting}] = useDeleteCategoryMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ProductCategoryType | null>(null)

    const [form] = Form.useForm<Partial<ProductCategoryType>>()

    const categories = useMemo(
        () => [...(data || [])].sort((a, b) => a.parent_category_id === b.parent_category_id ? a.id - b.id : (a.parent_category_id || 0) - (b.parent_category_id || 0)),
        [data]
    )

    const categoryTitleById = useMemo(
        () => new Map(categories.map((category) => [category.id, category.title])),
        [categories]
    )

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCategory(null)
        form.resetFields()
    }

    const openCreate = () => {
        setEditingCategory(null)
        form.resetFields()
        form.setFieldsValue({is_hide: false})
        setIsModalOpen(true)
    }

    const openEdit = (category: ProductCategoryType) => {
        setEditingCategory(category)
        form.setFieldsValue(category)
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            if (editingCategory) {
                await updateCategory({id: editingCategory.id, body: values}).unwrap()
                message.success("Категория обновлена")
            } else {
                await createCategory(values).unwrap()
                message.success("Категория создана")
            }
            closeModal()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id).unwrap()
            message.success("Категория удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<ProductCategoryType> = [
        {
            title: "Категория",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">/{record.url}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Родитель",
            dataIndex: "parent_category_id",
            render: (parentId: number | null) => parentId ? categoryTitleById.get(parentId) || `ID ${parentId}` : <Tag>Корневая</Tag>
        },
        {
            title: "Статус",
            dataIndex: "is_hide",
            render: (isHidden: boolean) => isHidden ? <Tag color="default">Скрыта</Tag> : <Tag color="green">В каталоге</Tag>
        },
        {
            title: "Действия",
            render: (_: unknown, record: ProductCategoryType) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(record)}>
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить категорию?"
                        description="Проверьте, что в категории нет товаров и дочерних разделов. Удаление влияет на навигацию каталога."
                        onConfirm={() => handleDelete(record.id)}
                        okButtonProps={{loading: isDeleting}}
                        okText="Удалить"
                        cancelText="Отмена"
                    >
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Категории товаров"
                subtitle="Иерархия товарных категорий и видимость в каталоге."
                addButtonText="Добавить категорию"
                onAdd={openCreate}
            >
                <Space direction="vertical" size={12} style={{padding: 16, width: "100%"}}>
                    <Alert
                        showIcon
                        type="info"
                        message="Категории управляют навигацией витрины"
                        description="Перед скрытием или удалением проверьте дочерние категории, товары и ссылки из маркетинговых материалов. URL лучше менять только до публикации."
                    />
                </Space>
                <Table<ProductCategoryType>
                    loading={isLoading}
                    dataSource={categories}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 760}}
                    locale={{
                        emptyText: (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Категории ещё не созданы">
                                <Button type="primary" onClick={openCreate}>Создать первую категорию</Button>
                            </Empty>
                        )
                    }}
                    pagination={{showSizeChanger: true, showTotal: (total) => `Всего категорий: ${total}`}}
                />
            </SettingsTableSection>

            <Modal
                title={editingCategory ? "Редактирование категории каталога" : "Создание категории каталога"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={form} layout="vertical" initialValues={{is_hide: false}}>
                    <Form.Item
                        name="title"
                        label="Название"
                        extra="Показывается менеджерам и покупателям в каталоге."
                        rules={[{required: true, message: "Введите название категории"}]}
                    >
                        <Input placeholder="Фигурки" />
                    </Form.Item>
                    <Form.Item name="parent_category_id" label="Родительская категория" extra="Оставьте пустым для верхнего уровня каталога.">
                        <Select allowClear placeholder="Выберите родительскую категорию">
                            {categories
                                .filter((category) => category.id !== editingCategory?.id)
                                .map((category) => (
                                    <Select.Option key={category.id} value={category.id}>
                                        {category.title}
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label="URL"
                        extra="Человекочитаемый путь без начального слеша; после запуска витрины изменение может ломать внешние ссылки."
                        rules={[{required: true, message: "Введите URL категории"}]}
                    >
                        <Input placeholder="figures" />
                    </Form.Item>
                    <Form.Item name="is_hide" label="Скрыта" valuePropName="checked" extra="Скрытая категория не должна использоваться в активных витринных сценариях.">
                        <Switch checkedChildren="Скрыта" unCheckedChildren="В каталоге" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductCategoryPage
