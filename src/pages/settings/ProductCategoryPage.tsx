import {Alert, Button, Card, Col, Empty, Form, Input, Modal, Popconfirm, Row, Segmented, Select, Space, Statistic, Switch, Table, Tag, Typography, message} from "antd"
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
type VisibilityFilter = "all" | "visible" | "hidden"
type HierarchyFilter = "all" | "root" | "child"

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
    const [categorySearch, setCategorySearch] = useState("")
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all")
    const [hierarchyFilter, setHierarchyFilter] = useState<HierarchyFilter>("all")
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)

    const [form] = Form.useForm<CategoryFormValues>()

    const categories = useMemo(
        () => [...(data ?? [])].sort((a, b) => (a.parent_category_id ?? 0) - (b.parent_category_id ?? 0) || a.title.localeCompare(b.title)),
        [data]
    )

    const categorySummary = useMemo(() => {
        const visible = categories.filter((category) => !category.is_hide).length
        const root = categories.filter((category) => !category.parent_category_id).length

        return {
            total: categories.length,
            visible,
            hidden: categories.length - visible,
            root,
            child: categories.length - root
        }
    }, [categories])

    const filteredCategories = useMemo(() => {
        const normalizedSearch = categorySearch.trim().toLowerCase()

        return categories.filter((category) => {
            const matchesSearch = !normalizedSearch
                || category.title.toLowerCase().includes(normalizedSearch)
                || category.url.toLowerCase().includes(normalizedSearch)
                || String(category.id).includes(normalizedSearch)
            const matchesVisibility = visibilityFilter === "all"
                || (visibilityFilter === "visible" && !category.is_hide)
                || (visibilityFilter === "hidden" && category.is_hide)
            const matchesHierarchy = hierarchyFilter === "all"
                || (hierarchyFilter === "root" && !category.parent_category_id)
                || (hierarchyFilter === "child" && Boolean(category.parent_category_id))

            return matchesSearch && matchesVisibility && matchesHierarchy
        })
    }, [categories, categorySearch, hierarchyFilter, visibilityFilter])

    const hasCategoryFilters = Boolean(categorySearch.trim()) || visibilityFilter !== "all" || hierarchyFilter !== "all"
    const isSaving = isCreating || isUpdating
    const isCategoryMutationLocked = isSaving || isDeleting
    const modalOkText = isSaving ? "Сохраняем…" : editingCategory ? "Сохранить" : "Создать"

    const resetCategoryFilters = () => {
        setCategorySearch("")
        setVisibilityFilter("all")
        setHierarchyFilter("all")
    }

    const parentTitleById = useMemo(
        () => new Map((data ?? []).map((category) => [category.id, category.title])),
        [data]
    )

    const closeModal = () => {
        if (isSaving) {
            return
        }

        setIsModalOpen(false)
        setEditingCategory(null)
        form.resetFields()
    }

    const openCreate = () => {
        if (isCategoryMutationLocked) {
            return
        }

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
        if (isCategoryMutationLocked) {
            return
        }

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
            if (typeof error === "object" && error !== null && "errorFields" in error) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingCategoryId(id)

        try {
            await deleteCategory(id).unwrap()
            message.success("Категория удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingCategoryId(null)
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
            render: (_, record) => {
                const isCurrentCategoryDeleting = deletingCategoryId === record.id
                const isAnotherCategoryDeleting = isDeleting && !isCurrentCategoryDeleting

                return (
                    <Space>
                        {canUpdate && (
                            <Button type="link" disabled={isCategoryMutationLocked} onClick={() => openEdit(record)}>
                                Редактировать
                            </Button>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title="Удалить категорию?"
                                description="Перед удалением проверьте, что в категории нет товаров и дочерних разделов. Действие нельзя отменить из админки."
                                okText={isCurrentCategoryDeleting ? "Удаляем…" : "Удалить"}
                                cancelText="Отмена"
                                okButtonProps={{loading: isCurrentCategoryDeleting, danger: true}}
                                onConfirm={() => handleDelete(record.id)}
                            >
                                <Button type="link" danger loading={isCurrentCategoryDeleting} disabled={isSaving || isAnotherCategoryDeleting}>
                                    {isCurrentCategoryDeleting ? "Удаляем…" : "Удалить"}
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                )
            }
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Категории товаров"
                subtitle="Иерархия товарных категорий, URL и видимость в клиентском каталоге."
                addButtonText="Добавить категорию"
                onAdd={openCreate}
                canAdd={canCreate && !isCategoryMutationLocked}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card size="small"><Statistic title="Всего категорий" value={categorySummary.total} /></Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card size="small"><Statistic title="Видны на витрине" value={categorySummary.visible} /></Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card size="small"><Statistic title="Скрыты" value={categorySummary.hidden} /></Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card size="small"><Statistic title="Корневые / дочерние" value={`${categorySummary.root} / ${categorySummary.child}`} /></Card>
                        </Col>
                    </Row>
                    <Alert
                        type="info"
                        showIcon
                        message="Фильтры помогают безопасно проверять структуру каталога"
                        description="Перед созданием новой категории найдите похожие разделы по названию, URL или ID и проверьте скрытые категории — так меньше риск дублей и сломанных клиентских ссылок."
                    />
                    <Space wrap style={{width: "100%", justifyContent: "space-between"}}>
                        <Space wrap>
                            <Input.Search
                                allowClear
                                placeholder="Найти категорию по названию, URL или ID"
                                value={categorySearch}
                                onChange={(event) => setCategorySearch(event.target.value)}
                                style={{width: 320, maxWidth: "100%"}}
                            />
                            <Segmented<VisibilityFilter>
                                value={visibilityFilter}
                                onChange={setVisibilityFilter}
                                options={[
                                    {label: "Все", value: "all"},
                                    {label: "Видимые", value: "visible"},
                                    {label: "Скрытые", value: "hidden"}
                                ]}
                            />
                            <Segmented<HierarchyFilter>
                                value={hierarchyFilter}
                                onChange={setHierarchyFilter}
                                options={[
                                    {label: "Все уровни", value: "all"},
                                    {label: "Корневые", value: "root"},
                                    {label: "Дочерние", value: "child"}
                                ]}
                            />
                        </Space>
                        <Typography.Text type="secondary">
                            Показано {filteredCategories.length} из {categories.length}
                        </Typography.Text>
                    </Space>
                    {hasCategoryFilters ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Применены фильтры категорий"
                            description="Если нужного раздела нет в списке, сбросьте поиск, видимость и уровень перед созданием новой категории."
                            action={<Button onClick={resetCategoryFilters}>Сбросить</Button>}
                        />
                    ) : null}
                    {isDeleting && deletingCategoryId !== null ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Удаляем категорию"
                            description="Дождитесь завершения операции перед созданием или редактированием других категорий, чтобы не получить конфликт в структуре каталога."
                        />
                    ) : null}
                    {isSaving ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Сохраняем категорию"
                            description="Поля и действия временно заблокированы, чтобы не отправить частично изменённую структуру каталога или URL витрины."
                        />
                    ) : null}
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
                        dataSource={filteredCategories}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        pagination={{pageSize: 20, showSizeChanger: true}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={isError
                                        ? "Категории не загружены"
                                        : hasCategoryFilters
                                            ? "По выбранным фильтрам категории не найдены. Сбросьте фильтры перед созданием новой категории, чтобы не завести дубль."
                                            : "Категорий пока нет"}
                                >
                                    {hasCategoryFilters ? (
                                        <Button onClick={resetCategoryFilters}>Сбросить фильтры</Button>
                                    ) : !isError && canCreate ? (
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
                okText={modalOkText}
                cancelText="Отмена"
                confirmLoading={isSaving}
                cancelButtonProps={{disabled: isSaving}}
                maskClosable={!isSaving}
                keyboard={!isSaving}
                closable={!isSaving}
                destroyOnHidden
            >
                <Alert
                    type={isSaving ? "info" : "warning"}
                    showIcon
                    style={{marginBottom: 16}}
                    message={isSaving ? "Сохраняем категорию каталога" : "Проверьте URL и родителя перед сохранением"}
                    description={isSaving
                        ? "Дождитесь ответа API: закрытие окна и изменение полей заблокированы, чтобы не смешать структуру каталога."
                        : "Эти поля влияют на навигацию каталога и клиентские ссылки. Скрывайте категорию, если раздел ещё не готов к витрине."}
                />
                <Form form={form} layout="vertical" disabled={isSaving}>
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
