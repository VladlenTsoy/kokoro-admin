import React from "react"
import {Form, Select} from "antd"
import {useGetSizesQuery} from "./sizeApi"
import type {SelectProps} from "antd"

const {Option} = Select

export interface SizesFormSelectProps {
    onChange?: SelectProps<number[]>["onChange"]
}

const SizesFormSelect: React.FC<SizesFormSelectProps> = ({onChange}) => {
    const {data, isLoading} = useGetSizesQuery()

    return (
        <Form.Item
            label="Размеры"
            name="size_ids"
            rules={[{required: true, message: "Выберите размер!"}]}
        >
            <Select
                showSearch
                mode="multiple"
                loading={isLoading}
                placeholder="Добавить размер"
                optionFilterProp="label"
                onChange={onChange}
            >
                {data &&
                    data.map(size => (
                        <Option
                            value={size.id}
                            key={`tag-${size.id}`}
                            label={size.title}
                        >
                            {size.title}
                        </Option>
                    ))}
            </Select>
        </Form.Item>
    )
}
export default React.memo<SizesFormSelectProps>(SizesFormSelect)