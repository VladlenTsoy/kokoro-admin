import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Empty, Space, Table, Tag, Typography} from "antd"
import type {TablePaginationConfig} from "antd"
import type {SorterResult} from "antd/es/table/interface"
import {createStyles} from "antd-style"
import type {Key} from "react"
import {useGetParams} from "../../../hooks/useProductGetParams.ts"
import type {ProductType, SelectProductsFilterParams} from "../ProductType.ts"
import {useGetProductsQuery} from "../productApi.ts"
import {useProductColumns} from "./product-columns/ProductColumns.tsx"
import ProductHeaderList from "./product-header-list/ProductHeaderList.tsx"

const useStyles = createStyles(({token}) => ({
    tableSurface: {
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        overflow: "hidden"
    },
    tableToolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorFillAlter,
        "@media (max-width: 768px)": {
            alignItems: "flex-start",
            flexDirection: "column"
        }
    },
    filterSummary: {
        color: token.colorTextSecondary
    },
    alert: {
        margin: "12px 16px 0"
    },
    readinessAlert: {
        margin: "12px 16px 0",
        ".ant-alert-description": {
            marginTop: 8
        }
    },
    readinessTags: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8
    },
    emptyText: {
        maxWidth: 460,
        margin: "0 auto"
    }
}))

const getActiveFiltersCount = (params: SelectProductsFilterParams) => [
    params.search.trim(),
    params.type !== "all" ? params.type : "",
    ...params.categoryIds,
    ...params.collectionIds,
    ...params.salesPointIds,
    ...params.storageIds,
    ...params.sizeIds
].filter(Boolean).length

const getCatalogReadinessSummary = (items: ProductType[]) => {
    const noPhotoCount = items.filter((item) => item.images.length === 0).length
    const zeroStockCount = items.filter((item) => item.sizes.length === 0 || item.sizes.every((size) => size.qty <= 0)).length
    const lowStockCount = items.filter((item) => item.sizes.some((size) => size.qty > 0 && size.qty <= size.min_qty)).length
    const expiredDiscountCount = items.filter((item) => item.discount?.endDate && new Date(item.discount.endDate).getTime() < Date.now()).length

    return {
        noPhotoCount,
        zeroStockCount,
        lowStockCount,
        expiredDiscountCount,
        hasWarnings: noPhotoCount > 0 || zeroStockCount > 0 || lowStockCount > 0 || expiredDiscountCount > 0
    }
}

const ProductList = () => {
    const {styles} = useStyles()
    const {params, updateParams} = useGetParams()
    const columns = useProductColumns()
    const {current, pageSize} = params.pagination
    const {isLoading, isFetching, isError, data, refetch} = useGetProductsQuery({
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
    const activeFiltersCount = getActiveFiltersCount(params)
    const hasActiveFilters = activeFiltersCount > 0
    const productItems = data?.items || []
    const productTotal = data?.total || 0
    const readinessSummary = getCatalogReadinessSummary(productItems)
    const emptyDescription = isError
        ? "Не удалось загрузить каталог. Повторите запрос или проверьте API перед массовыми изменениями."
        : hasActiveFilters
            ? "По текущим фильтрам товары не найдены. Сбросьте фильтры или уточните поиск перед созданием дубля."
            : "В каталоге пока нет товаров. Создайте первый товар, чтобы он появился в админке и витрине."

    const onClearFiltersHandler = () => updateParams("clear", undefined)
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
            <div className={styles.tableSurface}>
                <div className={styles.tableToolbar}>
                    <Space direction="vertical" size={2}>
                        <Typography.Text strong>Каталог товаров</Typography.Text>
                        <Typography.Text className={styles.filterSummary}>
                            {isFetching ? "Обновляем список…" : `Найдено товаров: ${productTotal}`}
                            {hasActiveFilters ? ` · активных фильтров: ${activeFiltersCount}` : " · без дополнительных фильтров"}
                        </Typography.Text>
                    </Space>
                    {hasActiveFilters && (
                        <Button onClick={onClearFiltersHandler}>
                            Сбросить фильтры
                        </Button>
                    )}
                </div>
                {isError && (
                    <Alert
                        className={styles.alert}
                        type="warning"
                        showIcon
                        message="Каталог временно не загрузился"
                        description="Данные в таблице могут быть неполными. Повторите запрос перед изменением цен, остатков или публикации."
                        action={(
                            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
                                Повторить
                            </Button>
                        )}
                    />
                )}
                {!isError && !isLoading && productItems.length > 0 && readinessSummary.hasWarnings && (
                    <Alert
                        className={styles.readinessAlert}
                        type="warning"
                        showIcon
                        message="На текущей странице есть товары, требующие внимания перед публикацией или промо"
                        description={(
                            <div className={styles.readinessTags}>
                                {readinessSummary.noPhotoCount > 0 && <Tag color="orange">Без фото: {readinessSummary.noPhotoCount}</Tag>}
                                {readinessSummary.zeroStockCount > 0 && <Tag color="red">Нет остатка: {readinessSummary.zeroStockCount}</Tag>}
                                {readinessSummary.lowStockCount > 0 && <Tag color="gold">Ниже минимума: {readinessSummary.lowStockCount}</Tag>}
                                {readinessSummary.expiredDiscountCount > 0 && <Tag color="volcano">Старая скидка: {readinessSummary.expiredDiscountCount}</Tag>}
                            </div>
                        )}
                    />
                )}
                <Table
                    loading={isLoading}
                    rowKey="id"
                    scroll={{x: true}}
                    dataSource={productItems}
                    columns={columns}
                    onChange={onChangeHandler}
                    pagination={{
                        ...params.pagination,
                        total: productTotal,
                        size: "default"
                    }}
                    locale={{
                        emptyText: (
                            <Empty description={emptyDescription}>
                                <Space direction="vertical" size={8}>
                                    <Typography.Text className={styles.emptyText}>
                                        {hasActiveFilters
                                            ? "Это защищает менеджера от случайного создания похожего товара из-за слишком узкого фильтра."
                                            : "Проверьте права доступа или добавьте товар через кнопку выше, если каталог действительно пуст."}
                                    </Typography.Text>
                                    {hasActiveFilters && (
                                        <Button type="primary" onClick={onClearFiltersHandler}>
                                            Сбросить фильтры
                                        </Button>
                                    )}
                                </Space>
                            </Empty>
                        )
                    }}
                    rowClassName="row-product"
                />
            </div>
        </div>
    )
}

export default ProductList
