import React from "react"
import {Select, Typography} from "antd"
import {useGetSalesPointsQuery} from "../../../../settings/sales-point/salesPointApi.ts"

interface Props {
    value: number[]
    onChange: (salesPointIds: number[]) => void
}

const ProductHeaderSalesPointFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isLoading} = useGetSalesPointsQuery(undefined, {refetchOnMountOrArgChange: true})

    return (
        <div style={{marginBottom: 16}}>
            <Typography.Title level={5}>Точки продаж</Typography.Title>
            <Select<number[]>
                mode="multiple"
                style={{width: "100%"}}
                placeholder="Фильтр по точкам продаж"
                loading={isLoading}
                value={value}
                onChange={onChange}
                optionFilterProp="label"
                allowClear
                showSearch
            >
                {data?.map((salesPoint) => (
                    <Select.Option key={salesPoint.id} value={salesPoint.id} label={salesPoint.title}>
                        {salesPoint.title}
                    </Select.Option>
                ))}
            </Select>
        </div>
    )
}

export default ProductHeaderSalesPointFilter
