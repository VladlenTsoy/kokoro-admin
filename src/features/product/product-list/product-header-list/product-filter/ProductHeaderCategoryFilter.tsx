import React from "react"
import {useGetCategoriesWithSubCategoriesQuery} from "../../../../product-category/productCategoryApi.ts"
import cn from "classnames"
import {createStyles} from "antd-style"
import {CheckOutlined} from "@ant-design/icons"
import {AnimatePresence, motion} from "framer-motion"
import MotionCheckAnimation from "../../../../../components/MotionCheckAnimation.tsx"

const useStyles = createStyles(({token}) => ({
    container: {
        marginTop: 8,
        marginBottom: 22
    },
    title: {
        fontSize: token.fontSizeLG,
        marginBottom: 12
    },
    subContainer: {
        paddingLeft: 8
    },
    subTitle: {
        marginBottom: 8,
        color: token.colorTextSecondary
    },
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridGap: 8
    },
    categoryItem: {
        padding: ".75rem 1rem",
        boxShadow: token.boxShadowTertiary,
        borderRadius: 15,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        alignItems: "center",
        border: `1px solid ${token.colorBorder}`,

        "&:hover": {
            backgroundColor: "#F8F9F9"
        }
    },
    active: {
        borderColor: token.colorPrimary
    },
    icon: {
        display: "inline-block",
        color: token.colorPrimary
    }
}))

interface Props {
    categoryIds: number[]
    onCategories: (categoryId?: number) => void
}

const ProductHeaderCategoryFilter: React.FC<Props> = ({categoryIds, onCategories}) => {
    const {styles} = useStyles()
    const {
        isLoading: isLoadingCategories,
        data: categories
    } = useGetCategoriesWithSubCategoriesQuery(undefined, {refetchOnMountOrArgChange: true})

    // Фильтрация категории
    const changeCategoryHandler = (categoryId?: number) =>
        onCategories(categoryId ? (categoryId) : undefined)

    if (isLoadingCategories)
        return null

    return (
        <div className={styles.container}>
            {categories?.map(category => (
                <div key={category.id}>
                    <p className={styles.title}>{category.title}</p>
                    {category.sub_categories?.map(subCategory =>
                        <div className={styles.subContainer} key={subCategory.id}>
                            <p className={styles.subTitle}>{subCategory.title}</p>
                            <div className={styles.gridContainer}>
                                {subCategory.sub_categories?.map(sub => {
                                    const isFind = categoryIds.includes((sub.id))

                                    return (
                                        <div
                                            key={sub.id}
                                            className={cn(styles.categoryItem, {[styles.active]: isFind})}
                                            onClick={() => changeCategoryHandler(sub.id)}
                                        >
                                            <AnimatePresence>
                                                {isFind &&
                                                    <MotionCheckAnimation>
                                                        <CheckOutlined className={styles.icon} />
                                                    </MotionCheckAnimation>
                                                }
                                                <motion.span
                                                    animate={
                                                        isFind
                                                            ? {
                                                                x: 15,
                                                                width: "calc(100% - 15px)"
                                                            }
                                                            : {x: 0, width: "100%"}
                                                    }
                                                    key="title"
                                                >
                                                    {sub.title}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default ProductHeaderCategoryFilter