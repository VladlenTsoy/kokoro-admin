import React from "react"
import {Form, Select, type SelectProps} from "antd"
import {useGetCollectionsQuery} from "./collectionApi.ts"

const {Option} = Select

export interface CollectionsFormSelectProps {
    onChange?: SelectProps<number[]>["onChange"]
}

const CollectionsFormSelect: React.FC<CollectionsFormSelectProps> = ({onChange}) => {
    const {data, isLoading} = useGetCollectionsQuery(undefined, {refetchOnMountOrArgChange: true})

    return (
        <Form.Item
            label="Коллекции"
            name="collection_ids"
        >
            <Select
                showSearch
                mode="multiple"
                loading={isLoading}
                placeholder="Выберите коллекции"
                optionFilterProp="label"
                onChange={onChange}
                allowClear
            >
                {data?.map((collection) => (
                    <Option
                        value={collection.id}
                        key={`collection-${collection.id}`}
                        label={collection.title}
                    >
                        {collection.title}
                    </Option>
                ))}
            </Select>
        </Form.Item>
    )
}

export default React.memo<CollectionsFormSelectProps>(CollectionsFormSelect)
