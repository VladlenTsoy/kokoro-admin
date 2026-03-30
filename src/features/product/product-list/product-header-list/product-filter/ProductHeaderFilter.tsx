import React, {useState} from "react"
import {Button, Drawer, Typography} from "antd"
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
    title: {
        marginBottom: "1.5rem!important"
    },
    actions: {
        display: "flex",
        gap: 8
    }
}))

const {Title} = Typography

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

    // Сбросить фильтрацию
    const resetHandler = () => {
        onClearFilter()
    }

    const close = () => setVisible(false)

    return (
        <>
            <Button icon={<FilterFilled />} size="large" onClick={() => setVisible(true)}>Фильтр</Button>
            <Drawer
                open={visible}
                onClose={close}
                // className={styles.drawer}
                // getContainer="#site-layout-content"
                placement="right"
                style={{left: "auto"}}
                size={470}
                closeIcon={false}
                zIndex={998}
            >
                <div className={styles.container}>
                    <div>
                        <Title level={3} className={styles.title}>Фильтрация</Title>
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
                    <div className={styles.actions}>
                        <Button size="large" block onClick={close}>
                            Закрыть
                        </Button>
                    </div>
                </div>
            </Drawer>
        </>
    )
}

export default ProductHeaderFilter
