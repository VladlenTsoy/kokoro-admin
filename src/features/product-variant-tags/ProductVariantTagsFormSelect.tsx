import {Alert, Button, Form, Select, Space, Tag, Typography} from "antd"
import {ReloadOutlined, TagsOutlined} from "@ant-design/icons"
import {useMemo} from "react"
import {
    PRODUCT_TAG_TYPE_LABELS,
    type ProductTagType,
    type ProductVariantTagType
} from "./ProductVariantTagType.ts"
import {useGetAllTagsQuery} from "./productVariantTagApi.ts"

function groupTagsByType(tags: ProductVariantTagType[]) {
    return tags.reduce<Record<ProductTagType, ProductVariantTagType[]>>((acc, tag) => {
        acc[tag.type] = [...(acc[tag.type] ?? []), tag]
        return acc
    }, {} as Record<ProductTagType, ProductVariantTagType[]>)
}

const ProductVariantTagsFormSelect = () => {
    const {data, isError, isFetching, isLoading, refetch} = useGetAllTagsQuery({isActive: "true"})
    const selectedTagIds = Form.useWatch("tags") as number[] | undefined

    const selectedTagsByType = useMemo(() => {
        const selectedIds = new Set(selectedTagIds ?? [])
        return groupTagsByType((data ?? []).filter((tag) => selectedIds.has(tag.id)))
    }, [data, selectedTagIds])

    const options = useMemo(() => {
        const groupedTags = groupTagsByType(data ?? [])

        return Object.entries(groupedTags).map(([type, tags]) => ({
            label: PRODUCT_TAG_TYPE_LABELS[type as ProductTagType],
            options: tags
                .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
                .map((tag) => ({
                    value: tag.id,
                    label: tag.title
                }))
        }))
    }, [data])

    const selectedGroups = Object.entries(selectedTagsByType).filter(([, tags]) => tags.length > 0)
    const hasLoadedTags = (data?.length ?? 0) > 0

    return (
        <>
            <Form.Item
                label="Теги"
                name="tags"
                extra="Используйте теги для витринных подборок, фильтров и быстрого поиска товара менеджерами."
            >
                <Select
                    mode="multiple"
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить теги" : "Выберите теги для витрины и фильтров"}
                    optionFilterProp="label"
                    options={options}
                    notFoundContent={
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Активные теги не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Проверьте настройки тегов перед сохранением карточки товара.
                            </Typography.Text>
                        </Space>
                    }
                    allowClear
                    disabled={isError && !hasLoadedTags}
                />
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Теги товара временно недоступны"
                    description="Карточку можно сохранить без изменения тегов, но перед публикацией проверьте, что витринные подборки и фильтры не потеряют нужную привязку."
                    action={
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    }
                />
            )}
            {!isLoading && !isError && !hasLoadedTags && (
                <Alert
                    type="info"
                    showIcon
                    icon={<TagsOutlined />}
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Активные теги ещё не настроены"
                    description="Создайте теги в настройках каталога, чтобы менеджеры могли связывать товары с сезонами, стилями, фандомами и витринными подборками."
                />
            )}
            {selectedGroups.length > 0 && (
                <Space direction="vertical" size={6} style={{marginTop: -12, marginBottom: 20}}>
                    {selectedGroups.map(([type, tags]) => (
                        <div key={type}>
                            <Typography.Text type="secondary">
                                {PRODUCT_TAG_TYPE_LABELS[type as ProductTagType]}
                            </Typography.Text>
                            <div>
                                {tags.map((tag) => (
                                    <Tag key={tag.id} color={tag.type === "color_palette" && tag.colorHex ? tag.colorHex : undefined}>
                                        {tag.title}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    ))}
                </Space>
            )}
        </>
    )
}

export default ProductVariantTagsFormSelect
