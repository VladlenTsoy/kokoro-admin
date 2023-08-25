import React, {useCallback, useEffect, useState} from "react"
import {Table} from "antd"
import {useGetAllProductsMutation} from "../../store/productsApi/productsApi"
import {Columns} from "./columns"
import {useGetParams} from "./useGetParams"
import {useLocation} from "react-router-dom"

const ProductList: React.FC = () => {
    const {params, updateParams} = useGetParams()
    const [fetchProductColors, {isLoading, data}] = useGetAllProductsMutation()

    const onChangeHandler = (pagination: any) => updateParams("pagination", pagination)

    let timeout: any
    const onSearchHandler = (e: any) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => updateParams("search", e.target.value), 300)
    }

    const onCategoryIdsHandler = useCallback(
        (categoryId?: number) => updateParams("categoryIds", categoryId),
        [updateParams]
    )

    const onSizeIdsHandler = useCallback((sizeId?: number) => updateParams("sizeIds", sizeId), [updateParams])

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
