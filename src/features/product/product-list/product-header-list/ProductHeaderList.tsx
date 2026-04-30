import {useCallback, useEffect, useRef} from "react"
import type {ChangeEvent} from "react"
import {Button, Input, Space} from "antd"
import ProductHeaderStatusFilter from "./ProductHeaderStatusFilter.tsx"
import {PlusCircleFilled, SearchOutlined} from "@ant-design/icons"
import ProductHeaderFilter from "./product-filter/ProductHeaderFilter.tsx"
import {Link} from "react-router-dom"
import {createStyles} from "antd-style"
import {useGetParams} from "../../../../hooks/useProductGetParams.ts"
import {useCan} from "../../../auth/permissions.ts"

const useStyles = createStyles(({token}) => ({
    container: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        "@media (max-width: 960px)": {
            alignItems: "stretch",
            flexDirection: "column"
        }
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        "@media (max-width: 960px)": {
            justifyContent: "flex-start",
            flexWrap: "wrap"
        },
        [`@media (max-width: ${token.screenSM}px)`]: {
            flexDirection: "column",
            width: "100%",
            ".ant-input-affix-wrapper, .ant-btn, a": {
                width: "100%"
            }
        }
    },
    search: {
        width: 260,
        [`@media (max-width: ${token.screenSM}px)`]: {
            width: "100%"
        }
    }
}))

const ProductHeaderList = () => {
    const {styles} = useStyles()
    const {params, updateParams} = useGetParams()
    const canCreateCatalog = useCan("catalog.create")

    const timeoutRef = useRef<number | null>(null)
    const onSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = window.setTimeout(() => updateParams("search", e.target.value), 300)
    }
    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const onCategoryIdsHandler = useCallback(
        (categoryId?: number) => updateParams("categoryIds", categoryId),
        [updateParams]
    )

    const onSizeIdsHandler = useCallback(
        (sizeId?: number) => updateParams("sizeIds", sizeId),
        [updateParams]
    )
    const onCollectionIdsHandler = useCallback(
        (collectionIds: number[]) => updateParams("collectionIds", collectionIds),
        [updateParams]
    )
    const onSalesPointIdsHandler = useCallback(
        (salesPointIds: number[]) => updateParams("salesPointIds", salesPointIds),
        [updateParams]
    )
    const onStorageIdsHandler = useCallback(
        (storageIds: number[]) => updateParams("storageIds", storageIds),
        [updateParams]
    )

    const onClearFilterHandler = useCallback(
        () => updateParams("clear", undefined),
        [updateParams]
    )

    return (
        <div className={styles.container}>
            <ProductHeaderStatusFilter defaultSelected={Number(params.type)} />
            <Space className={styles.actions}>
                <Input className={styles.search} placeholder="Поиск..." size="large" suffix={<SearchOutlined />} onChange={onSearchHandler} />
                <ProductHeaderFilter
                    categoryIds={params.categoryIds}
                    sizeIds={params.sizeIds}
                    collectionIds={params.collectionIds}
                    salesPointIds={params.salesPointIds}
                    storageIds={params.storageIds}
                    onCategories={onCategoryIdsHandler}
                    onSizes={onSizeIdsHandler}
                    onCollections={onCollectionIdsHandler}
                    onSalesPoints={onSalesPointIdsHandler}
                    onStorages={onStorageIdsHandler}
                    onClearFilter={onClearFilterHandler}
                />
                {canCreateCatalog && (
                    <Link to="/products/product/create">
                        <Button icon={<PlusCircleFilled />} size="large">Добавить</Button>
                    </Link>
                )}
            </Space>
        </div>
    )
}

export default ProductHeaderList
