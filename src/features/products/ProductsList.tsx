import React, {useEffect} from "react"
import {Table} from "antd"
import {useGetAllProductsMutation} from "./ProductApi"
import {Columns} from "./Columns"
import {useGetParams} from "../../hooks/useGetParams"

const ProductList: React.FC = () => {
    const {params, updateParams} = useGetParams()
    const [fetchProductColors, {isLoading, data}] = useGetAllProductsMutation()

    const onChangeHandler = (pagination: any) => updateParams("pagination", pagination)

    useEffect(() => {
        const promise = fetchProductColors(params)
        return () => {
            promise.abort()
        }
    }, [fetchProductColors, params])

    return (
        <>
            <Table
                size="small"
                loading={isLoading}
                showHeader={true}
                rowKey="id"
                scroll={{x: true}}
                dataSource={data ? data.results : []}
                columns={Columns}
                pagination={{
                    ...params.pagination,
                    total: data?.total || 0,
                    size: "default"
                }}
                onChange={onChangeHandler}
                rowClassName="rowProduct"
            />
        </>
    )
}

export default ProductList
