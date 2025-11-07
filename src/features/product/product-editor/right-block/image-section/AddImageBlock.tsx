import React from "react"
import {PlusOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    addPhoto: {
        width: "150px",
        position: "relative",
        display: "inline-block",
        marginBottom: "0.5rem",
        zIndex: 5,
        backgroundColor: token.colorBgContainer,

        "&::before": {
            content: "\"\"",
            display: "block",
            paddingBottom: "125%"
        }
    },

    content: {
        position: "absolute",
        height: "100%",
        borderRadius: token.borderRadius,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        border: `1px solid ${token.colorBorder}`,
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        gap: "1rem",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",

        "&:hover": {
            borderColor: token.colorPrimary
        }
    },

    addPhotoIcon: {
        background: token.colorPrimary,
        color: token.colorText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.75rem",
        fontSize: `calc(${token.fontSizeLG}px + 10px)`,
        borderRadius: "50%",
    },

    addPhotoText: {
        color: token.colorText,
        fontSize: token.fontSizeLG
    },

    addPhotoInput: {
        display: "none"
    }
}))


interface AddImageBlockProps {
    addPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const AddImageBlock: React.FC<AddImageBlockProps> = ({addPhoto}) => {
    const {styles} = useStyles()

    return (
        <label className={styles.addPhoto} htmlFor="add-photo">
            <div className={styles.content}>
                <div className={styles.addPhotoIcon}>
                    <PlusOutlined />
                </div>
                <div className={styles.addPhotoText}>Добавить</div>
                <input
                    type="file"
                    onChange={addPhoto}
                    id="add-photo"
                    hidden
                    className={styles.addPhotoInput}
                    accept="image/x-png,image/gif,image/jpeg"
                />
            </div>
        </label>
    )
}
export default AddImageBlock