import React from "react"
import { createUseStyles } from "react-jss"

interface DetailsProps {
    title: string
    product: any
}

const useStyles = createUseStyles({
        title: {
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            fontWeight: "500",
            marginBottom: "0.25rem",
        },
        isNew: {
            backgroundColor: "fade(green, 20%)",
            color: "red",
            padding: "0.1rem 0.3rem",
            borderRadius: "10px",
            marginLeft: "0.5rem"
        },
        colorHexBlock: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
        },
        colorHexCircle: {
            display: 'inline-block',
            height: '20px',
            width: '20px',
            marginRight: '0.5rem',
            borderRadius: '50%',
            boxShadow: '0 2.5px 5px 0 rgb(0 0 0 / 10%)',
        }
})

const Details: React.FC<DetailsProps> = ({title, product}) => {
    const styles = useStyles()
    return (
        <div>
            <div className={styles.title}>
                {title}
                {product.is_new && <div className={styles.isNew}>new</div>}
            </div>
            <div className={styles.colorHexBlock}>
                <div className={styles.colorHexCircle} style={{background: product.color.hex}} />
                {product.color.title}
            </div>
        </div>
    )
}
export default Details
