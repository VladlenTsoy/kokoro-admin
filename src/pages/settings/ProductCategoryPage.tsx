import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "../../features/product-category/productCategoryApi.ts"
import type {ProductCategoryType} from "../../features/product-category/ProductCategoryTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {useCan} from "../../features/auth/permissions.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

type CategoryFormValues = Pick<ProductCategoryType, "title" | "parent_category_id" | "url" | "is_hide">

const ProductCategoryPage = () => {
    const {data, isLoading, isError, refetch} = useGetCategoriesQuery()
    const [createCategory, {isLoading: isCreating}] = useCreateCategoryMutation()
    const [updateCategory, {isLoading: isUpdating}] = useUpdateCategoryMutation()
    const [deleteCategory, {isLoading: isDeleting}] = useDeleteCategoryMutation()

    const canCreate = useCan("catalog.create")
    const canUpdate = useCan("catalog.update")
    const canDelete = useCan("catalog.delete")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ProductCategoryType | null>(null)

    const [form] = Form.useForm<CategoryFormValues>()

    const categories = useMemo(
        () => [...(data ?? [])].sort((a, b) => (a.parent_category_id ?? 0) - (b.parent_category_id ?? 0) || a.title.localeCompare(b.title)),
        [data]
    )

    const parentTitleById = useMemo(
        () => new Map((data ?? []).map((category) => [category.id, category.title])),
        [data]
    )

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCategory(null)
        form.resetFields()
    }

    const openCreate = () => {
        setEditingCategory(null)
        form.setFieldsValue({
            title: "",
            parent_category_id: null,
            url: "",
            is_hide: false
        })
        setIsModalOpen(true)
    }

    const openEdit = (category: ProductCategoryType) => {
        setEditingCategory(category)
        form.setFieldsValue({
            title: category.title,
            parent_category_id: category.parent_category_id,
            url: category.url,
            is_hide: category.is_hide
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload = {
                ...values,
                title: values.title.trim(),
                url: values.url.trim(),
                parent_category_id: values.parent_category_id ?? null,
                is_hide: values.is_hide ?? false
            }

            if (editingCategory) {
                await updateCategory({id: editingCategory.id, body: payload}).unwrap()
                message.success("Категория обновлена")
            } else {
                await createCategory(payload).unwrap()
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
            render: (title: string, category) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Space size={6} wrap>
                        <Tag color="blue">ID {category.id}</Tag>
                        <Typography.Text type="secondary">{category.url ? `URL: /${category.url}` : "URL не задан"}</Typography.Text>
                    </Space>
                </Space>
            )
        },
        {
            title: "Родитель",
            dataIndex: "parent_category_id",
            render: (parentId: number | null) => parentId ? (
                <Typography.Text>{parentTitleById.get(parentId) ?? `ID ${parentId}`}</Typography.Text>
            ) : (
                <Tag>Корневая</Tag>
            )
        },
        {
            title: "Витрина",
            dataIndex: "is_hide",
            render: (isHidden: boolean) => (
                <Space direction="vertical" size={2}>
                    <Tag color={isHidden ? "default" : "green"}>{isHidden ? "Скрыта" : "Показывается"}</Tag>
                    <Typography.Text type="secondary">{isHidden ? "Не видна клиентам" : "Доступна в каталоге"}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Space>
                    {canUpdate && (
                        <Button type="link" onClick={() => openEdit(record)}>
                            Редактировать
                        </Button>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Удалить категорию?"
                            description="Перед удалением проверьте, что в категории нет товаров и дочерних разделов. Действие нельзя отменить из админки."
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{loading: isDeleting}}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button type="link" danger>
                                Удалить
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Категории товаров"
                subtitle="Иерархия товарных категорий, URL и видимость в клиентском каталоге."
                addButtonText="Добавить категорию"
                onAdd={openCreate}
                canAdd={canCreate}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {isError ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить категории"
                            description="Не меняйте структуру каталога вслепую: категории влияют на навигацию, товары и клиентскую витрину. Повторите загрузку или передайте проблему администратору."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    ) : null}
                    <Table
                        loading={isLoading}
                        dataSource={categories}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        pagination={{pageSize: 20, showSizeChanger: true}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={isError ? "Категории не загружены" : "Категорий пока нет"}
                                >
                                    {!isError && canCreate ? (
                                        <Button type="primary" onClick={openCreate}>Создать первую категорию</Button>
                                    ) : null}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingCategory ? "Редактирование категории" : "Создание категории"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                okText={editingCategory ? "Сохранить" : "Создать"}
                cancelText="Отмена"
                confirmLoading={isCreating || isUpdating}
                destroyOnHidden
            >
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Проверьте URL и родителя перед сохранением"
                    description="Эти поля влияют на навигацию каталога и клиентские ссылки. Скрывайте категорию, если раздел ещё не готов к витрине."
                />
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true, message: "Введите название категории"}]}>
                        <Input placeholder="Например: Платья" />
                    </Form.Item>
                    <Form.Item name="parent_category_id" label="Родительская категория" extra="Оставьте пустым для раздела верхнего уровня.">
                        <Select allowClear placeholder="Корневая категория">
                            {categories
                                .filter((cat) => cat.id !== editingCategory?.id)
                                .map((cat) => (
                                    <Select.Option key={cat.id} value={cat.id}>
                                        {cat.title}
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label="URL"
                        extra="Используйте короткий латинский slug без пробелов, чтобы не ломать клиентские ссылки."
                        rules={[{required: true, message: "Введите URL категории"}]}
                    >
                        <Input placeholder="dresses" addonBefore="/" />
                    </Form.Item>
                    <Form.Item name="is_hide" label="Скрыта на витрине" valuePropName="checked" extra="Включите, если категорию нужно подготовить без показа клиентам.">
                        <Switch checkedChildren="Скрыта" unCheckedChildren="Видна" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductCategoryPage
