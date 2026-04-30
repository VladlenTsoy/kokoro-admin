import React, {useState} from "react"
import {Badge, Button, Drawer} from "antd"
import {FilterFilled, ClearOutlined} from "@ant-design/icons"
import ProductHeaderCategoryFilter from "./ProductHeaderCategoryFilter.tsx"
import ProductHeaderSizeFilter from "./ProductHeaderSizeFilter.tsx"
import ProductHeaderCollectionFilter from "./ProductHeaderCollectionFilter.tsx"
import ProductHeaderSalesPointFilter from "./ProductHeaderSalesPointFilter.tsx"
import ProductHeaderStorageFilter from "./ProductHeaderStorageFilter.tsx"
import {createStyles} from "antd-style"

const useStyles = createStyles(() => ({
    container: {
        flex: 1,
        height: "100%",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column"
    },
    actions: {
        display: "flex",
        gap: 8
    }
}))

interface Props {
    onCategories: (categoryId?: number) => void
    onSizes: (sizeId?: number) => void
    onCollections: (collectionIds: number[]) => void
    onSalesPoints: (salesPointIds: number[]) => void
    onStorages: (storageIds: number[]) => void
    onClearFilter: () => void
    categoryIds: number[]
    sizeIds: number[]
    collectionIds: number[]
    salesPointIds: number[]
    storageIds: number[]
}

const ProductHeaderFilter: React.FC<Props> = ({
    onCategories,
    categoryIds,
    sizeIds,
    onSizes,
    onClearFilter,
    onCollections,
    onSalesPoints,
    onStorages,
    collectionIds,
    salesPointIds,
    storageIds
}) => {
    const {styles} = useStyles()
    const [visible, setVisible] = useState(false)
    const activeFiltersCount = (
        categoryIds.length +
        sizeIds.length +
        collectionIds.length +
        salesPointIds.length +
        storageIds.length
    )

    // Сбросить фильтрацию
    const resetHandler = () => {
        onClearFilter()
    }

    const close = () => setVisible(false)

    return (
        <>
            <Badge count={activeFiltersCount} size="small">
                <Button icon={<FilterFilled />} size="large" onClick={() => setVisible(true)}>Фильтр</Button>
            </Badge>
            <Drawer
                title="Фильтрация"
                open={visible}
                onClose={close}
                placement="right"
                width="min(470px, 100vw)"
                zIndex={998}
                footer={(
                    <div className={styles.actions}>
                        <Button size="large" block onClick={close}>
                            Закрыть
                        </Button>
                    </div>
                )}
            >
                <div className={styles.container}>
                    <div>
                        <ProductHeaderCategoryFilter onCategories={onCategories} categoryIds={categoryIds} />
                        <ProductHeaderSizeFilter sizeIds={sizeIds} onSizes={onSizes} />
                        <ProductHeaderCollectionFilter value={collectionIds} onChange={onCollections} />
                        <ProductHeaderSalesPointFilter value={salesPointIds} onChange={onSalesPoints} />
                        <ProductHeaderStorageFilter value={storageIds} onChange={onStorages} />
                        <Button
                            icon={<ClearOutlined />}
                            disabled={
                                !categoryIds.length &&
                                !sizeIds.length &&
                                !collectionIds.length &&
                                !salesPointIds.length &&
                                !storageIds.length
                            }
                            onClick={resetHandler}
                        >
                            Сбросить фильтр
                        </Button>
                    </div>
                </div>
            </Drawer>
        </>
    )
}

export default ProductHeaderFilter
