import React from "react"
import {Select, Typography} from "antd"
import {useGetStoragesQuery} from "../../../../settings/product-storage/productStorageApi.ts"

interface Props {
    value: number[]
    onChange: (storageIds: number[]) => void
}

const ProductHeaderStorageFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isLoading} = useGetStoragesQuery(undefined, {refetchOnMountOrArgChange: true})

    return (
        <div style={{marginBottom: 16}}>
            <Typography.Title level={5}>Места хранения</Typography.Title>
            <Select<number[]>
                mode="multiple"
                style={{width: "100%"}}
                placeholder="Фильтр по местам хранения"
                loading={isLoading}
                value={value}
                onChange={onChange}
                optionFilterProp="label"
                allowClear
                showSearch
            >
                {data?.map((storage) => (
                    <Select.Option key={storage.id} value={storage.id} label={storage.title}>
                        {storage.title}
                    </Select.Option>
                ))}
            </Select>
        </div>
    )
}

export default ProductHeaderStorageFilter
