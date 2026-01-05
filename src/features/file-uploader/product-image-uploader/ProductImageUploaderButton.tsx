import React from "react"
import {PlusOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"
import cn from "classnames"

const useStyles = createStyles(({token}) => ({
    addImageButton: {
        width: "100%",
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #EEEFF1",
        borderRadius: "13px",
        cursor: "pointer"
    },
    actionIcon: {
        width: "40px",
        aspectRatio: "1 / 1",
        backgroundColor: token.colorPrimary,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 25,
    },
    first: {
        gridColumnStart: "span 2"
    },
    addPhotoInput: {
        display: "none"
    }
}))

interface Props {
    addPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
    isFirst: boolean
}

const ProductImageUploaderButton: React.FC<Props> = ({addPhoto, isFirst}) => {
    const {styles} = useStyles()

    return (
        <label className={cn(styles.addImageButton, isFirst && styles.first)}>
            <div className={styles.actionIcon}>
                <PlusOutlined />
            </div>
            <input
                type="file"
                onChange={addPhoto}
                id="add-photo"
                hidden
                multiple
                className={styles.addPhotoInput}
                accept="image/x-png,image/gif,image/jpeg"
            />
        </label>
    )
}

export default ProductImageUploaderButton