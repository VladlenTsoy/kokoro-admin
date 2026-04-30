import {Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message} from "antd"
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

type ProductTagFormValues = ProductVariantTagPayload

const ACTIVE_OPTIONS = [
    {label: "Активные", value: "true"},
    {label: "Неактивные", value: "false"}
]

const ProductTagsPage = () => {
    const [filters, setFilters] = useState<ProductVariantTagFilters>({})
    const {data, isLoading} = useGetAllTagsQuery(filters)
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

    const tags = useMemo(
        () => [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id),
        [data]
    )

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingTag(null)
        form.resetFields()
    }

    const openCreate = () => {
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
            message.error(getNestErrorMessage(error))
        }
    }

    const handleToggleActive = async (tag: ProductVariantTagType, isActive: boolean) => {
        try {
            await updateTag({id: tag.id, body: {isActive}}).unwrap()
            message.success(isActive ? "Тег активирован" : "Тег деактивирован")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteTag(id).unwrap()
            message.success("Тег удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<ProductVariantTagType> = [
        {
            title: "title",
            dataIndex: "title",
            render: (title: string, tag) => (
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
                    {title}
                </Space>
            )
        },
        {title: "slug", dataIndex: "slug"},
        {
            title: "type",
            dataIndex: "type",
            render: (type: ProductTagType) => <Tag>{PRODUCT_TAG_TYPE_LABELS[type]}</Tag>
        },
        {
            title: "colorHex",
            dataIndex: "colorHex",
            render: (colorHex?: string | null) => colorHex || "—"
        },
        {
            title: "isActive",
            dataIndex: "isActive",
            render: (isActive: boolean, tag) => (
                <Switch
                    checked={isActive}
                    disabled={!canUpdate}
                    onChange={(checked) => handleToggleActive(tag, checked)}
                />
            )
        },
        {title: "sortOrder", dataIndex: "sortOrder", sorter: (a, b) => a.sortOrder - b.sortOrder},
        {
            title: "actions",
            key: "actions",
            render: (_, tag) => (
                <Space>
                    {canUpdate && (
                        <Button type="link" onClick={() => openEdit(tag)}>
                            Редактировать
                        </Button>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Удалить тег?"
                            onConfirm={() => handleDelete(tag.id)}
                            okButtonProps={{loading: isDeleting}}
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
        <>
            <SettingsTableSection
                title="Теги"
                subtitle="Управляемый словарь тегов для фильтров, мерчандайзинга и карточек товаров."
                addButtonText="Создать тег"
                onAdd={openCreate}
                canAdd={canCreate}
            >
                <Space style={{padding: 16}} wrap>
                    <Input.Search
                        placeholder="Поиск по title или slug"
                        allowClear
                        onSearch={(search) => setFilters((prev) => ({...prev, search: search || undefined}))}
                        style={{width: 280}}
                    />
                    <Select
                        allowClear
                        placeholder="Тип"
                        options={PRODUCT_TAG_TYPE_OPTIONS}
                        style={{width: 210}}
                        onChange={(type) => setFilters((prev) => ({...prev, type}))}
                    />
                    <Select
                        allowClear
                        placeholder="Активность"
                        options={ACTIVE_OPTIONS}
                        style={{width: 170}}
                        onChange={(isActive) => setFilters((prev) => ({...prev, isActive}))}
                    />
                </Space>
                <Table<ProductVariantTagType>
                    rowKey="id"
                    loading={isLoading}
                    dataSource={tags}
                    columns={columns}
                    scroll={{x: 1000}}
                />
            </SettingsTableSection>

            <Modal
                title={editingTag ? "Редактировать тег" : "Создать тег"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
            >
                <Form<ProductTagFormValues> form={form} layout="vertical" initialValues={{type: "custom", isActive: true, sortOrder: 100}}>
                    <Form.Item
                        name="title"
                        label="title"
                        rules={[{required: true, message: "Введите title"}]}
                    >
                        <Input placeholder="Pastel" />
                    </Form.Item>
                    <Form.Item name="type" label="type">
                        <Select options={PRODUCT_TAG_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="slug" label="slug" extra="Можно оставить пустым: backend сгенерирует slug сам.">
                        <Input placeholder="pastel" />
                    </Form.Item>
                    {selectedType === "color_palette" && (
                        <Form.Item
                            name="colorHex"
                            label="colorHex"
                            rules={[{pattern: /^#([0-9A-Fa-f]{6})$/, message: "Неверный HEX код"}]}
                        >
                            <Input type="color" />
                        </Form.Item>
                    )}
                    <Form.Item name="sortOrder" label="sortOrder">
                        <InputNumber min={0} style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="isActive" label="isActive" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProductTagsPage
