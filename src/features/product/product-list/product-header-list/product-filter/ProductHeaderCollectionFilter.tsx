import React from "react"
import {Select, Typography} from "antd"
import {useGetCollectionsQuery} from "../../../../settings/collection/collectionApi.ts"

interface Props {
    value: number[]
    onChange: (collectionIds: number[]) => void
}

const ProductHeaderCollectionFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isLoading} = useGetCollectionsQuery(undefined, {refetchOnMountOrArgChange: true})

    return (
        <div style={{marginBottom: 16}}>
            <Typography.Title level={5}>Коллекции</Typography.Title>
            <Select<number[]>
                mode="multiple"
                style={{width: "100%"}}
                placeholder="Фильтр по коллекциям"
                loading={isLoading}
                value={value}
                onChange={onChange}
                optionFilterProp="label"
                allowClear
                showSearch
            >
                {data?.map((collection) => (
                    <Select.Option key={collection.id} value={collection.id} label={collection.title}>
                        {collection.title}
                    </Select.Option>
                ))}
            </Select>
        </div>
    )
}

export default ProductHeaderCollectionFilter
