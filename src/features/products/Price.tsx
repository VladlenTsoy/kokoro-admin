import React from "react"
import {createUseStyles} from "react-jss"
import {formatDate} from "../../utils/formatDate"
import {ClockCircleOutlined} from "@ant-design/icons"
import {Tooltip} from "antd"
import {formatPrice} from "../../utils/formatPrice"

const useStyles = createUseStyles({
    priceBlock: {
        display: "flex",
        alignItems: "center"
    },
    price: {
        fontWeight: "500",
        marginRight: "0.25rem"
    },
    discount: {
        display: "flex",
        alignItems: "center",
        fontSize: "10px",
        padding: "0.15rem 0.5rem",
        borderRadius: "10px",
        marginRight: "0.5rem",
        backgroundColor: "#efb9b9",
        color: "red"
    },
    extra: {
        color: "#c2c7cf"
    }
})

interface PriceProps {
    discount?: {discount: number, end_at: string};
    price: number;
}

const Price: React.FC<PriceProps> = ({discount, price}) => {
    const styles = useStyles()
    return (
        <div className={styles.priceBlock}>
            {discount ? (
                <>
                    <Tooltip title={discount.end_at ? `До ${formatDate(discount.end_at)}` : null}>
                        <div className={styles.discount}>
                            {discount.end_at && <ClockCircleOutlined />}
                            <div>{discount.discount}%</div>
                        </div>
                    </Tooltip>
                    <span className={styles.price}>{formatPrice(price, discount)}</span>
                    <span className={styles.extra}>сум</span>
                </>
            ) : (
                <>
                    <span className={styles.price}>{formatPrice(price)}</span>
                    <span className={styles.extra}>сум</span>
                </>
            )}
        </div>
    )
}

export default Price
