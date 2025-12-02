import React from "react"
import cn from "classnames"
import {useGetSizesQuery} from "../../../../settings/size/sizeApi.ts"
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
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gridGap: 8,
        paddingLeft: 8
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
    sizeIds: number[]
    onSizes: (sizeId?: number) => void
}

const ProductHeaderSizeFilter: React.FC<Props> = ({sizeIds, onSizes}) => {
    const {styles} = useStyles()
    const {isLoading: isLoadingSizes, data: sizes} = useGetSizesQuery(undefined, {refetchOnMountOrArgChange: true})

    // Фильтрация размеров
    const changeSizeHandler = (sizeId?: number) => onSizes(sizeId ? (sizeId) : undefined)

    if (isLoadingSizes)
        return null

    return (
        <div className={styles.container}>
            <p className={styles.title}>Размеры</p>
            <div className={styles.gridContainer}>
                {sizes?.map(size => {
                    const isFind = sizeIds.includes((size.id))

                    return (
                        <div
                            key={size.id}
                            className={cn(styles.categoryItem, {[styles.active]: isFind})}
                            onClick={() => changeSizeHandler(size.id)}
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
                                    {size.title}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ProductHeaderSizeFilter