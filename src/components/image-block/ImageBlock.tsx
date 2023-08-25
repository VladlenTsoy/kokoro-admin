import React, {useEffect, useState} from "react"
import LoadingOutlined from "@ant-design/icons/LoadingOutlined"
import WarningOutlined from "@ant-design/icons/WarningOutlined"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
    imageBlock: {
        height: '100%',
        width: '100%',
    },
    loading: {
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
    },
    image: {
        height: '100%',
        width: '100%',
        '& img': {
            height: '100%',
            width: '100%',
            objectFit: 'cover',
        }
    }
})

interface ImageBlockProps {
    image: string
    title?: string
}

const ImageBlock: React.FC<ImageBlockProps> = ({image: src, title}) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const styles = useStyles()

    useEffect(() => {
        const image = new Image()
        image.src = src
        setLoading(!image.complete)
        image.onload = () => {
            setError(false)
            setLoading(false)
        }
        image.onerror = () => {
            setError(true)
        }

        return () => {
            image.onload = null
            image.onerror = null
        }
    }, [src])

    return (
        <div className={styles.imageBlock}>
            {
                !error ?
                    loading ?
                        <div className={styles.loading}>
                            <LoadingOutlined />
                        </div> :
                        <div className={styles.image}>
                            <img src={src} alt={title} />
                        </div> :
                    <div className={styles.loading}>
                        <WarningOutlined />
                    </div>
            }
        </div>
    )
}

export default ImageBlock