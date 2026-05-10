import {useGetProductsQuery} from "../productApi.ts"
import {Button, Empty, Space, Table, Typography} from "antd"
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
    const activeFiltersCount = (
        params.categoryIds.length +
        params.collectionIds.length +
        params.salesPointIds.length +
        params.storageIds.length +
        params.sizeIds.length +
        (params.search ? 1 : 0) +
        (params.type && params.type !== "all" ? 1 : 0)
    )
    const hasActiveFilters = activeFiltersCount > 0
    const emptyText = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={(
                <Space direction="vertical" size={4}>
                    <Typography.Text strong>
                        {hasActiveFilters ? "По заданным условиям товары не найдены" : "В каталоге пока нет товаров"}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                        {hasActiveFilters
                            ? "Сбросьте поиск, статус или фильтры, чтобы вернуться к полному каталогу."
                            : "Добавьте первый товар, чтобы менеджеры могли управлять остатками, ценами и публикацией."}
                    </Typography.Text>
                </Space>
            )}
        >
            {hasActiveFilters && (
                <Button onClick={() => updateParams("clear", undefined)}>
                    Сбросить фильтры
                </Button>
            )}
        </Empty>
    )
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
                    size: "default"
                }}
                locale={{emptyText}}
                rowClassName="row-product"
            />
        </div>
    )
}

export default ProductList
