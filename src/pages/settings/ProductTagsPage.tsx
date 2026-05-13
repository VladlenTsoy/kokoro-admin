import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {
    PRODUCT_TAG_TYPE_LABELS,
    PRODUCT_TAG_TYPE_OPTIONS,
    type ProductTagType,
    type ProductVariantTagFilters,
    type ProductVariantTagPayload,
    type ProductVariantTagType
} from "../../features/product-variant-tags/ProductVariantTagType.ts"
import {
    useCreateTagMutation,
    useDeleteTagMutation,
    useGetAllTagsQuery,
    useUpdateTagMutation
} from "../../features/product-variant-tags/productVariantTagApi.ts"
import {useCan} from "../../features/auth/permissions.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"

type ProductTagFormValues = ProductVariantTagPayload

const ACTIVE_OPTIONS = [
    {label: "Активные", value: "true"},
    {label: "Неактивные", value: "false"}
]

const ACTIVE_FILTER_LABELS: Record<NonNullable<ProductVariantTagFilters["isActive"]>, string> = {
    true: "Только активные",
    false: "Только неактивные"
}

const ProductTagsPage = () => {
    const [filters, setFilters] = useState<ProductVariantTagFilters>({})
    const {data, isLoading, isFetching, isError, refetch} = useGetAllTagsQuery(filters)
    const [createTag, {isLoading: isCreating}] = useCreateTagMutation()
    const [updateTag, {isLoading: isUpdating}] = useUpdateTagMutation()
    const [deleteTag, {isLoading: isDeleting}] = useDeleteTagMutation()
    const [form] = Form.useForm<ProductTagFormValues>()
    const selectedType = Form.useWatch("type", form)

    const canCreate = useCan("catalog.create")
    const canUpdate = useCan("catalog.update")
    const canDelete = useCan("catalog.delete")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTag, setEditingTag] = useState<ProductVariantTagType | null>(null)
    const [activeToggleTagId, setActiveToggleTagId] = useState<number | null>(null)
    const [deletingTagId, setDeletingTagId] = useState<number | null>(null)

    const tags = useMemo(
        () => [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id),
        [data]
    )
    const tagSummary = useMemo(() => ({
        total: tags.length,
        active: tags.filter((tag) => tag.isActive).length,
        inactive: tags.filter((tag) => !tag.isActive).length,
        colorPalettes: tags.filter((tag) => tag.type === "color_palette").length
    }), [tags])
    const hasActiveFilters = Boolean(filters.search || filters.type || filters.isActive)
    const isSavingTag = isCreating || isUpdating
    const isTagMutationInFlight = isSavingTag || isDeleting
    const isTagListUnconfirmed = isLoading || isFetching || isError || !Array.isArray(data)
    const areTagActionsBlocked = isTagMutationInFlight || isTagListUnconfirmed
    const tagActionsDisabledReason = isSavingTag
        ? "Дождитесь сохранения текущего тега перед следующим изменением."
        : isDeleting
            ? "Дождитесь удаления текущего тега перед следующим изменением."
            : isLoading
                ? "Список тегов ещё загружается — сначала подтвердите актуальные фильтры и подборки."
                : isFetching
                    ? "Обновляем список тегов — изменения временно заблокированы, чтобы не работать с устаревшими данными."
                    : isError || !Array.isArray(data)
                        ? "Повторите загрузку списка тегов перед изменениями: теги влияют на фильтры, подборки и карточки товаров."
                        : undefined

    const resetFilters = () => setFilters({})

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingTag(null)
        form.resetFields()
    }

    const openCreate = () => {
        if (areTagActionsBlocked) {
            return
        }

        setEditingTag(null)
        form.setFieldsValue({
            title: "",
            slug: "",
            type: "custom",
            colorHex: undefined,
            isActive: true,
            sortOrder: 100
        })
        setIsModalOpen(true)
    }

    const openEdit = (tag: ProductVariantTagType) => {
        if (areTagActionsBlocked) {
            return
        }

        setEditingTag(tag)
        form.setFieldsValue({
            title: tag.title,
            slug: tag.slug,
            type: tag.type,
            colorHex: tag.colorHex ?? undefined,
            isActive: tag.isActive,
            sortOrder: tag.sortOrder
        })
        setIsModalOpen(true)
    }

    const normalizePayload = (values: ProductTagFormValues): ProductVariantTagPayload => ({
        ...values,
        slug: values.slug?.trim() || undefined,
        type: values.type ?? "custom",
        colorHex: values.type === "color_palette" ? values.colorHex : null,
        isActive: values.isActive ?? true,
        sortOrder: values.sortOrder ?? 100
    })

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload = normalizePayload(values)

            if (editingTag) {
                await updateTag({id: editingTag.id, body: payload}).unwrap()
                message.success("Тег обновлён")
            } else {
                await createTag(payload).unwrap()
                message.success("Тег создан")
            }

            closeModal()
        } catch (error) {
            if (isAntdFormValidationError(error)) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const handleToggleActive = async (tag: ProductVariantTagType, isActive: boolean) => {
        if (isTagListUnconfirmed || (isTagMutationInFlight && activeToggleTagId !== tag.id)) {
            return
        }

        setActiveToggleTagId(tag.id)

        try {
            await updateTag({id: tag.id, body: {isActive}}).unwrap()
            message.success(isActive ? "Тег активирован" : "Тег деактивирован")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setActiveToggleTagId(null)
        }
    }

    const handleDelete = async (tag: ProductVariantTagType) => {
        if (isTagListUnconfirmed || (isTagMutationInFlight && deletingTagId !== tag.id)) {
            return
        }

        setDeletingTagId(tag.id)

        try {
            await deleteTag(tag.id).unwrap()
            message.success(`Тег «${tag.title}» удалён`)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingTagId(null)
        }
    }

    const columns: ColumnsType<ProductVariantTagType> = [
        {
            title: "Тег",
            dataIndex: "title",
            render: (title: string, tag) => (
                <Space direction="vertical" size={2}>
                    <Space>
                        {tag.type === "color_palette" && tag.colorHex && (
                            <span
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 6,
                                    border: "1px solid rgba(0,0,0,0.18)",
                                    background: tag.colorHex,
                                    display: "inline-block"
                                }}
                            />
                        )}
                        <Typography.Text strong>{title}</Typography.Text>
                    </Space>
                    <Space size={6} wrap>
                        <Tag color="blue">ID {tag.id}</Tag>
                        <Typography.Text type="secondary">{tag.slug ? `slug: ${tag.slug}` : "slug создаст backend"}</Typography.Text>
                    </Space>
                </Space>
            )
        },
        {
            title: "Тип",
            dataIndex: "type",
            render: (type: ProductTagType) => <Tag>{PRODUCT_TAG_TYPE_LABELS[type]}</Tag>
        },
        {
            title: "Цвет",
            dataIndex: "colorHex",
            render: (colorHex?: string | null) => colorHex ? (
                <Space>
                    <span
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.18)",
                            background: colorHex,
                            display: "inline-block"
                        }}
                    />
                    {colorHex}
                </Space>
            ) : <Typography.Text type="secondary">Не задан</Typography.Text>
        },
        {
            title: "Статус",
            dataIndex: "isActive",
            render: (isActive: boolean, tag) => (
                <Space direction="vertical" size={4}>
                    <Tag color={isActive ? "green" : "default"}>{isActive ? "Активен" : "Скрыт"}</Tag>
                    <Switch
                        checked={isActive}
                        disabled={!canUpdate || isTagListUnconfirmed || (isTagMutationInFlight && activeToggleTagId !== tag.id)}
                        loading={activeToggleTagId === tag.id}
                        checkedChildren="Вкл"
                        unCheckedChildren="Выкл"
                        onChange={(checked) => handleToggleActive(tag, checked)}
                    />
                    {!canUpdate && <Typography.Text type="secondary">Нет прав на изменение</Typography.Text>}
                    {canUpdate && isTagListUnconfirmed && (
                        <Typography.Text type="secondary">Сначала дождитесь подтверждённой загрузки списка</Typography.Text>
                    )}
                </Space>
            )
        },
        {title: "Сортировка", dataIndex: "sortOrder", sorter: (a, b) => a.sortOrder - b.sortOrder},
        {
            title: "Действия",
            key: "actions",
            render: (_, tag) => (
                <Space>
                    {canUpdate && (
                        <Button type="link" disabled={areTagActionsBlocked} onClick={() => openEdit(tag)}>
                            Редактировать
                        </Button>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Удалить тег?"
                            description="Проверьте, что тег не используется в активных товарах, фильтрах или промо-подборках. Действие нельзя отменить из админки."
                            okText={deletingTagId === tag.id ? "Удаляем…" : "Удалить"}
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(tag)}
                            okButtonProps={{
                                loading: deletingTagId === tag.id,
                                disabled: isTagListUnconfirmed || (isTagMutationInFlight && deletingTagId !== tag.id)
                            }}
                        >
                            <Button type="link" danger loading={deletingTagId === tag.id} disabled={isTagListUnconfirmed || (isTagMutationInFlight && deletingTagId !== tag.id)}>
                                {deletingTagId === tag.id ? "Удаляем…" : "Удалить"}
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Теги"
                subtitle="Управляемый словарь тегов для фильтров, мерчандайзинга и карточек товаров."
                addButtonText="Создать тег"
                onAdd={openCreate}
                canAdd={canCreate}
                addButtonDisabled={areTagActionsBlocked}
                addButtonDisabledReason={tagActionsDisabledReason}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {deletingTagId ? (
                        <Alert
                            type="warning"
                            showIcon
                            style={{margin: "16px 16px 0"}}
                            message="Удаляем тег каталога"
                            description="Пока запрос выполняется, создание, редактирование и соседние удаления заблокированы, чтобы не смешать изменения фильтров и подборок."
                        />
                    ) : null}
                    {isFetching && !isLoading ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Проверяем актуальность тегов товаров"
                            description="Пока список обновляется, создание, редактирование, активация и удаление временно заблокированы, чтобы менеджер не изменил устаревшие фильтры или подборки."
                        />
                    ) : null}
                    {isError ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить теги товаров"
                            description="Не меняйте теги вслепую: они влияют на фильтры, подборки и карточки товаров. Создание, редактирование, активация и удаление заблокированы до успешной повторной загрузки."
                            action={<Button size="small" loading={isFetching} onClick={() => refetch()}>Повторить</Button>}
                        />
                    ) : null}
                    <Alert
                        type="info"
                        showIcon
                        style={{margin: "16px 16px 0"}}
                        message="Контекст словаря тегов"
                        description={(
                            <Space size={8} wrap>
                                <Tag color="blue">Показано: {tagSummary.total}</Tag>
                                <Tag color="green">Активные: {tagSummary.active}</Tag>
                                <Tag>Скрытые: {tagSummary.inactive}</Tag>
                                <Tag color="purple">Цветовые палитры: {tagSummary.colorPalettes}</Tag>
                                <Typography.Text type="secondary">
                                    Перед созданием нового тега проверьте поиск и тип, чтобы не плодить дубли в фильтрах и подборках.
                                </Typography.Text>
                            </Space>
                        )}
                    />
                    <Space style={{padding: 16, paddingBottom: 0}} wrap>
                        <Input.Search
                            placeholder="Поиск по названию или slug"
                            allowClear
                            value={filters.search}
                            onChange={(event) => setFilters((prev) => ({...prev, search: event.target.value || undefined}))}
                            onSearch={(search) => setFilters((prev) => ({...prev, search: search || undefined}))}
                            style={{width: 280}}
                        />
                        <Select
                            allowClear
                            placeholder="Тип тега"
                            options={PRODUCT_TAG_TYPE_OPTIONS}
                            value={filters.type}
                            style={{width: 210}}
                            onChange={(type) => setFilters((prev) => ({...prev, type}))}
                        />
                        <Select
                            allowClear
                            placeholder="Активность"
                            options={ACTIVE_OPTIONS}
                            value={filters.isActive}
                            style={{width: 170}}
                            onChange={(isActive) => setFilters((prev) => ({...prev, isActive}))}
                        />
                        {hasActiveFilters && <Button onClick={resetFilters}>Сбросить фильтры</Button>}
                    </Space>
                    {hasActiveFilters ? (
                        <Space style={{padding: "0 16px"}} size={6} wrap>
                            <Typography.Text type="secondary">Показаны теги по фильтрам:</Typography.Text>
                            {filters.search && <Tag>Поиск: {filters.search}</Tag>}
                            {filters.type && <Tag>{PRODUCT_TAG_TYPE_LABELS[filters.type]}</Tag>}
                            {filters.isActive && <Tag>{ACTIVE_FILTER_LABELS[filters.isActive]}</Tag>}
                        </Space>
                    ) : null}
                    <Table<ProductVariantTagType>
                        rowKey="id"
                        loading={isLoading}
                        dataSource={tags}
                        columns={columns}
                        scroll={{x: 1000}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasActiveFilters ? "Теги по выбранным фильтрам не найдены" : "Теги товаров ещё не созданы"}
                                >
                                    {hasActiveFilters ? (
                                        <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                    ) : (
                                        canCreate && <Button type="primary" onClick={openCreate} disabled={areTagActionsBlocked}>Создать первый тег</Button>
                                    )}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingTag ? "Редактировать тег" : "Создать тег"}
                open={isModalOpen}
                onCancel={() => {
                    if (!isSavingTag) {
                        closeModal()
                    }
                }}
                onOk={handleSubmit}
                okText={isSavingTag ? "Сохраняем…" : editingTag ? "Сохранить тег" : "Создать тег"}
                cancelButtonProps={{disabled: isSavingTag}}
                maskClosable={!isSavingTag}
                keyboard={!isSavingTag}
                confirmLoading={isSavingTag}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Теги помогают менеджерам быстро собирать фильтры и подборки"
                    description="Используйте понятное название, выбирайте точный тип и меняйте slug только если понимаете, где он уже используется. Для цветовой гаммы укажите HEX, чтобы тег легко узнавался в таблице."
                />
                <Form<ProductTagFormValues> form={form} layout="vertical" initialValues={{type: "custom", isActive: true, sortOrder: 100}}>
                    <Form.Item
                        name="title"
                        label="Название"
                        extra="Короткое имя, которое менеджеры увидят в каталоге и фильтрах."
                        rules={[{required: true, message: "Введите название"}, {max: 120, message: "Максимум 120 символов"}]}
                    >
                        <Input placeholder="Пастель" maxLength={120} showCount disabled={isSavingTag} />
                    </Form.Item>
                    <Form.Item name="type" label="Тип тега" extra="Тип помогает не смешивать сезон, стиль, фандом и цветовые палитры.">
                        <Select options={PRODUCT_TAG_TYPE_OPTIONS} disabled={isSavingTag} />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" extra="Можно оставить пустым: backend сгенерирует slug сам. Меняйте существующий slug осторожно — он может использоваться в ссылках или фильтрах.">
                        <Input placeholder="pastel" disabled={isSavingTag} />
                    </Form.Item>
                    {selectedType === "color_palette" && (
                        <Form.Item
                            name="colorHex"
                            label="HEX цвет"
                            extra="Например #F4C6D7. Цвет нужен для быстрой визуальной проверки палитры."
                            rules={[{pattern: /^#([0-9A-Fa-f]{6})$/, message: "Неверный HEX код"}]}
                        >
                            <Input type="color" disabled={isSavingTag} />
                        </Form.Item>
                    )}
                    <Form.Item name="sortOrder" label="Порядок сортировки" extra="Меньшее число поднимает тег выше в списках.">
                        <InputNumber min={0} style={{width: "100%"}} disabled={isSavingTag} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked" extra="Отключите тег, если он больше не должен использоваться в новых фильтрах и подборках.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" disabled={isSavingTag} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductTagsPage
