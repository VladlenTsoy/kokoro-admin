import type {ProductSizeType} from "../../ProductType.ts"
import React from "react"
import {createStyles} from "antd-style"
import cn from "classnames"

const useStyles = createStyles(() => ({
    container: {
        display: "flex",
        alignItems: "center",
        gap: ".5rem",
        whiteSpace: "nowrap"
    },
    size: {
        display: "flex",
        alignItems: "center",
        gap: ".25rem",
        padding: "0.25rem 0.75rem",
        color: "#535964",
        "&:first-child": {
            paddingLeft: "0"
        }
    },
    title: {
        fontWeight: 400
    },
    qty: {
        fontWeight: 500
    },
    meta: {
        fontSize: 11,
        color: "#8C8C8C"
    },
    danger: {
        color: "#F04438!important"
    },
    warning: {
        color: "#ffaf73!important"
    }
}))

interface Props {
    sizes: ProductSizeType[]
}

const ProductTableSizesColumn: React.FC<Props> = ({sizes}) => {
    const {styles} = useStyles()

    return (
        <div className={styles.container}>
            {sizes.map(size => {
                const reservedQty = Number(size.reservedQty || 0)
                const availableQty = Math.max(Number(size.qty || 0) - reservedQty, 0)

                return (
                    <div
                        key={size.id}
                        className={cn(styles.size, {
                            [styles.danger]: availableQty <= 0,
                            [styles.warning]: availableQty <= size.min_qty
                        })}
                        title={`На складе: ${size.qty}; резерв: ${reservedQty}; продано: ${size.soldQty || 0}`}
                    >
                        <b className={styles.title}>{size.size.title}</b>
                        <span>-</span>
                        <span className={styles.qty}>{availableQty}</span>
                        {reservedQty > 0 && <span className={styles.meta}>рез. {reservedQty}</span>}
                    </div>
                )
            })}
        </div>
    )
}

export default ProductTableSizesColumn
