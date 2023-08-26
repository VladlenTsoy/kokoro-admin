import React from "react"
import {createUseStyles} from "react-jss"

const useStyles = createUseStyles({
    sizes: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        whiteSpace: "nowrap"
    },
    size: {
        borderRadius: "5px",
        padding: "0.25rem 0.75rem",

        "& b": {
            marginRight: "0.5rem",
            fontWeight: "400",
            borderRadius: "5px"
        },

        "& span": {
            fontWeight: "500"
        }
    }
})

interface SizesProps {
    sizes: any;
}

interface Size {
    id: number
    size_id: number
    title: string
    qty: number
    min_qty: number
    cost_price: number
}

const Sizes: React.FC<SizesProps> = ({sizes}) => {
    const styles = useStyles()
    return (
        <div className={styles.sizes}>
            {sizes.map((size: Size) => {
                return (
                    <div key={size.id} className={styles.size}>
                        <b>{size.title}</b>
                        <span className={styles.size}>{size.qty}</span>
                    </div>
                )
            })}
        </div>
    )
}
export default Sizes
