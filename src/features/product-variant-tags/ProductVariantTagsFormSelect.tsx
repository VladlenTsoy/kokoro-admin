import React from "react"
import {Form, Select} from "antd"
import {useGetAllTagsQuery} from "./productVariantTagApi.ts"

const {Option} = Select

const ProductVariantTagsFormSelect: React.FC = () => {
    const {data, isLoading} = useGetAllTagsQuery()

    return (
        <Form.Item label="Теги" name="tags_id">
            <Select mode="tags" loading={isLoading} placeholder="Добавить тег" optionFilterProp="label">
                {data &&
                    data.map(tag => (
                        <Option value={String(tag.id)} key={`tag-${tag.id}`} label={tag.title}>
                            {tag.title}
                        </Option>
                    ))}
            </Select>
        </Form.Item>
    )
}

export default ProductVariantTagsFormSelect