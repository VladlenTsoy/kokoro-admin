import {useGetProductsQuery} from "../productApi.ts"
import {Table} from "antd"
import type {TablePaginationConfig} from "antd"
import type {SorterResult} from "antd/es/table/interface"
import type {ProductType} from "../ProductType.ts"
import type {Key} from "react"
import {useGetParams} from "../../../hooks/useProductGetParams.ts"
import {useProductColumns} from "./product-columns/ProductColumns.tsx"
import ProductHeaderList from "./product-header-list/ProductHeaderList.tsx"


const ProductList = () => {
    const {params, updateParams} = useGetParams()
    const columns = useProductColumns()
    const {current, pageSize} = params.pagination
    const {isLoading, data} = useGetProductsQuery({
        page: current,
        pageSize: pageSize,
        categoryIds: params.categoryIds,
        collectionIds: params.collectionIds,
        salesPointIds: params.salesPointIds,
        storageIds: params.storageIds,
        sizeIds: params.sizeIds,
        search: params.search,
        statusId: params.type,
        sortField: params.sorter.field,
        sortOrder: params.sorter.order
    }, {refetchOnMountOrArgChange: true})
    //
    const onChangeHandler = (
        pagination: TablePaginationConfig,
        _filters: Record<string, (Key | boolean)[] | null>,
        sorter: SorterResult<ProductType> | SorterResult<ProductType>[]
    ) => {
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter

        const nextSorter = activeSorter?.field && activeSorter?.order
            ? {field: String(activeSorter.field), order: activeSorter.order}
            : undefined

        if (nextSorter && (nextSorter.field !== params.sorter.field || nextSorter.order !== params.sorter.order)) {
            updateParams("sorter", nextSorter)
            return
        }

        if (!nextSorter && params.sorter.field !== "created_at") {
            updateParams("sorter", undefined)
            return
        }

        updateParams("pagination", {current: pagination.current, pageSize: pagination.pageSize})
    }

    return (
        <div>
            <ProductHeaderList />
            <Table
                loading={isLoading}
                rowKey="id"
                scroll={{x: true}}
                dataSource={data?.items || []}
                columns={columns}
                onChange={onChangeHandler}
                pagination={{
                    ...params.pagination,
                    total: data?.total || 0,
                    size: "default",
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) => `Показано ${range[0]}–${range[1]} из ${total} товаров`
                }}
                rowClassName="row-product"
            />
        </div>
    )
}

export default ProductList
