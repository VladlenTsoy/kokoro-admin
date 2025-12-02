import {createStyles} from "antd-style"
import {Checkbox, Form} from "antd"
import React from "react"

const useStyles = createStyles(({token}) => ({
    container: {
        backgroundColor: "#F8F9F9",
        padding: "17px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2rem",
        borderRadius: token.borderRadius,
        cursor: "pointer",
    },
    title: {},
    desc: {
        fontSize: token.fontSizeSM,
        color: token.colorTextSecondary,
        lineHeight: 1.5,
    },
    checkbox: {
        transform: "scale(1.5)",
    }
}))

interface Props {
    name: string
    title: string
    description: string
}

const ProductFormCheckboxPanel: React.FC<Props> = ({name, title, description}) => {
    const {styles} = useStyles()

    return (
        <Form.Item name={name}>
            <label className={styles.container}>
                <div>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.desc}>{description}</div>
                </div>
                <Checkbox className={styles.checkbox} />
            </label>
        </Form.Item>
    )
}

export default ProductFormCheckboxPanel