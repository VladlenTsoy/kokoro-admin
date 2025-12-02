import {useCallback} from "react"
import {Button, Input, Space} from "antd"
import ProductHeaderStatusFilter from "./ProductHeaderStatusFilter.tsx"
import {PlusCircleFilled, SearchOutlined} from "@ant-design/icons"
import ProductHeaderFilter from "./product-filter/ProductHeaderFilter.tsx"
import {Link} from "react-router-dom"
import {createStyles} from "antd-style"
import {useGetParams} from "../../../../hooks/useProductGetParams.ts"

const useStyles = createStyles(() => ({
    container: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 16
    }
}))

const ProductHeaderList = () => {
    const {styles} = useStyles()
    const {params, updateParams} = useGetParams()

    let timeout: number
    const onSearchHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearTimeout(timeout)
        timeout = window.setTimeout(() => updateParams("search", e.target.value), 300)
    }

    const onCategoryIdsHandler = useCallback(
        (categoryId?: number) => updateParams("categoryIds", categoryId),
        [updateParams]
    )

    const onSizeIdsHandler = useCallback(
        (sizeId?: number) => updateParams("sizeIds", sizeId),
        [updateParams]
    )

    const onClearFilterHandler = useCallback(
        () => updateParams("clear", undefined),
        [updateParams]
    )

    return (
        <div className={styles.container}>
            <ProductHeaderStatusFilter defaultSelected={Number(params.type)} />
            <Space>
                <Input placeholder="Поиск..." size="large" suffix={<SearchOutlined />} onChange={onSearchHandler} />
                <ProductHeaderFilter
                    categoryIds={params.categoryIds}
                    sizeIds={params.sizeIds}
                    onCategories={onCategoryIdsHandler}
                    onSizes={onSizeIdsHandler}
                    onClearFilter={onClearFilterHandler}
                />
                <Link to="/products/product/create">
                    <Button icon={<PlusCircleFilled />} size="large">Добавить</Button>
                </Link>
            </Space>
        </div>
    )
}

export default ProductHeaderList