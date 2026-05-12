import {createStyles} from "antd-style"
import {Badge, Checkbox, Form} from "antd"
import React from "react"

const useStyles = createStyles(({token}) => ({
    container: {
        backgroundColor: token.colorFillAlter,
        padding: "17px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2rem",
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        cursor: "pointer",
        marginBottom: "24px",
        transition: "border-color 0.2s, background-color 0.2s",
        "@media (max-width: 575px)": {
            alignItems: "flex-start",
            gap: token.paddingSM,
            padding: "14px 16px"
        }
    },
    containerActive: {
        backgroundColor: token.colorPrimaryBg,
        borderColor: token.colorPrimaryBorder
    },
    content: {
        minWidth: 0
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: token.paddingXS,
        flexWrap: "wrap",
        marginBottom: 4
    },
    title: {
        fontWeight: token.fontWeightStrong
    },
    desc: {
        fontSize: token.fontSizeSM,
        color: token.colorTextSecondary,
        lineHeight: 1.5
    },
    checkbox: {
        transform: "scale(1.5)"
    }
}))

interface Props {
    name: string
    title: string
    description: string
    activeLabel?: string
    inactiveLabel?: string
}

const ProductFormCheckboxPanel: React.FC<Props> = ({
    name,
    title,
    description,
    activeLabel = "Включено",
    inactiveLabel = "Выключено"
}) => {
    const {styles, cx} = useStyles()

    return (
        <Form.Item shouldUpdate noStyle>
            {({getFieldValue}) => {
                const checked = Boolean(getFieldValue(name))

                return (
                    <label className={cx(styles.container, checked && styles.containerActive)}>
                        <div className={styles.content}>
                            <div className={styles.titleRow}>
                                <span className={styles.title}>{title}</span>
                                <Badge
                                    status={checked ? "processing" : "default"}
                                    text={checked ? activeLabel : inactiveLabel}
                                />
                            </div>
                            <div className={styles.desc}>{description}</div>
                        </div>
                        <Form.Item name={name} valuePropName="checked" style={{marginBottom: 0}}>
                            <Checkbox aria-label={title} className={styles.checkbox} />
                        </Form.Item>
                    </label>
                )
            }}
        </Form.Item>
    )
}

export default ProductFormCheckboxPanel