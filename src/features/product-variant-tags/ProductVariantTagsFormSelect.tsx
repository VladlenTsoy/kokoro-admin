import {Form, Select, Space, Tag, Typography} from "antd"
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
    const {data, isLoading} = useGetAllTagsQuery({isActive: "true"})
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

    return (
        <>
            <Form.Item label="Теги" name="tags">
                <Select
                    mode="multiple"
                    loading={isLoading}
                    placeholder="Выберите теги"
                    optionFilterProp="label"
                    options={options}
                    allowClear
                />
            </Form.Item>
            {selectedGroups.length > 0 && (
                <Space orientation="vertical" size={6} style={{marginTop: -12, marginBottom: 20}}>
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
