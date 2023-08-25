import React, {useState} from "react"
import ImageBlock from "../../components/image-block/ImageBlock"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
    previewImage: {
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        display: 'block',

        '&::before': {
            content: "",
            display: 'block',
            paddingBottom: 'calc(100% / 0.8)',
        },

        borderRadius: '10px',
        overflow: 'hidden',
    }
})

interface PreviewImageProps {
    image: string
    product: any
}

const PreviewImage: React.FC<PreviewImageProps> = ({image, product}) => {
    const styles = useStyles()

    return (
        <>
            <div style={{width: "45px"}}>
                <div className={styles.previewImage}>
                    <ImageBlock image={image} title={product.title} />
                </div>
            </div>
        </>
    )
}
export default PreviewImage
