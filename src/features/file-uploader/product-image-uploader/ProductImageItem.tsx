import React from "react"
import cn from "classnames"
import {createStyles} from "antd-style"
import {DeleteOutlined, LoadingOutlined, StarFilled} from "@ant-design/icons"
import {Tooltip} from "antd"
import {motion} from "framer-motion"
import SizeBytesBlock from "../../../components/SizeBytesBlock.tsx"

const useStyles = createStyles(({token}) => ({
    container: {
        position: "relative",
        "&:hover": {}
    },
    item: {
        transformOrigin: "0 0",
        aspectRatio: "1 / 1",
        width: "100%",
        backgroundColor: token.colorBgContainerDisabled,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
        borderRadius: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 500,
        cursor: "grab",
        userSelect: "none",
        transition: "all .2s ease-in-out"
    },
    dragging: {
        opacity: 0.5
    },
    deleteIcon: {
        height: 35,
        width: 35,
        borderRadius: "50%",
        position: "absolute",
        top: 10,
        right: 10,
        background: token.colorBgContainer,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 22,
        boxShadow: token.boxShadowTertiary,
        transition: "all .3s ease-in-out",
        "&:hover": {
            background: token.colorError,
            color: "white"
        }
    },
    star: {
        height: 30,
        width: 30,
        borderRadius: "50%",
        position: "absolute",
        top: 40,
        left: 10,
        background: token.colorPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "help"
    },
    imageLoading: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        fontSize: 40,
        color: token.colorWhite
    },
    itemLoading: {
        filter: "blur(3px)"
    }
}))

interface Props {
    url: string
    path?: string
    loading?: boolean
    size?: number
    isFirst: boolean
    isDragging: boolean
    removePhoto?: (path: string) => void
}

const ProductImageItem: React.FC<Props> = ({isDragging, loading, size, url, isFirst, removePhoto, path}) => {
    const {styles} = useStyles()

    return (
        <motion.div
            className={styles.container}
            whileHover="hover"
            initial="rest"
            animate="rest"
        >

            {loading && (
                <div className={styles.imageLoading}>
                    <LoadingOutlined />
                </div>
            )}

            {size && (
                <SizeBytesBlock size={size} />
            )}

            <div
                className={cn(
                    styles.item,
                    loading && styles.itemLoading,
                    isDragging && styles.dragging
                )}
                style={{backgroundImage: `url(${url})`}}
            />
            {
                removePhoto &&
                <motion.div
                    className={styles.deleteIcon}
                    variants={{
                        rest: {
                            y: "-100%",
                            opacity: 0
                        },
                        hover: {
                            y: 0,
                            opacity: 1
                        }
                    }}
                    transition={{
                        duration: 0.02,
                        ease: "easeInOut"
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (path) removePhoto(path)
                    }}
                >
                    <DeleteOutlined />
                </motion.div>
            }
            {
                isFirst &&
                <Tooltip title="Эта картинка будет использоваться как основное изображение товара">
                    <span className={styles.star}><StarFilled /></span>
                </Tooltip>
            }
        </motion.div>
    )
}

export default ProductImageItem