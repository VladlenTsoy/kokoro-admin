import type {ProductSizeType} from "../ProductType.ts"
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
            {sizes.map(size => (
                <div
                    key={size.id}
                    className={cn(styles.size, {
                        [styles.danger]: size.qty <= 0,
                        [styles.warning]: size.qty <= size.min_qty
                    })}
                >
                    <b className={styles.title}>{size.size.title}</b>
                    <span>-</span>
                    <span className={styles.qty}>{size.qty}</span>
                </div>
            ))}
        </div>
    )
}

export default ProductTableSizesColumn