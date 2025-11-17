import React from "react"
import cn from "classnames"
import {DeleteOutlined, LoadingOutlined, StarFilled} from "@ant-design/icons"
import type {TemporaryImageType} from "./ImagesSection.tsx"
import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import {createStyles} from "antd-style"
import SizeBytesBlock from "../../../../../components/SizeBytesBlock.tsx"
import ImageBlockAction from "./ImageBlockAction.tsx"

const useStyles = createStyles(({css, cx, token}) => {
    // === Дочерние блоки ===
    const close = cx(css`
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        padding: 0.5rem;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${token.colorBgContainer};
        border-radius: 50%;
        font-size: ${token.fontSizeLG}px;
        box-shadow: ${token.boxShadow};
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        transform: translateY(-100%);
        opacity: 0;

        &:hover {
            color: ${token.colorError};
        }
    `)


    const info = cx(css`
        position: absolute;
        background: ${token.colorPrimary};
        color: ${token.colorWhite};
        padding: 0.25rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${token.fontSize}px;
        box-shadow: ${token.boxShadow};
        top: 0.5rem;
        left: 0.5rem;
        animation: fadeIn 0.3s alternate;
        transition: opacity 0.2s 0.5s ease-in-out;
        z-index: 5;

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `)

    const photoImg = cx(css`
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        //overflow: hidden;
        transition: 0.5s filter linear;
    `)

    const photoLoading = cx(css`
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        font-size: 40px;
        color: ${token.colorWhite};
    `)

    // === Основные контейнеры ===
    const draggablePhoto = cx(css`
        width: 150px;
        position: relative;
        display: inline-block;
        margin-bottom: 0.5rem;

        &::before {
            content: "";
            display: block;
            padding-bottom: 125%;
        }

        &:not(:last-child) {
            margin-right: 1rem;
        }
    `)

    const photoBlock = css`
        position: absolute;
        background: ${token.colorBgContainer};
        height: 100%;
        border-radius: ${token.borderRadius}px;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        transition: all 0.2s ease-in-out;
        //overflow: hidden;

        &:hover {
            .${close} {
                opacity: 1;
                transform: translateY(0%);
            }

            .actions {
                opacity: 1;
                transform: translateY(40%);
            }
        }

        &:active {
            .${info} {
                opacity: 0;
            }
        }

        &.loading {
            .${photoImg} {
                filter: blur(10px);
                border-radius: ${token.borderRadius}px;
                overflow: hidden;
            }
        }
    `

    return {
        draggablePhoto,
        photoBlock,
        photoLoading,
        photoImg,
        close,
        info
    }
})

interface PhotoBlockProps {
    index: number
    image: TemporaryImageType
    nextHandler?: (id: number) => void
    prevHandler?: (id: number) => void
    deletePhoto: (path: string) => void
}

const ImageBlock: React.FC<PhotoBlockProps> = (
    {
        index,
        nextHandler,
        prevHandler,
        image,
        deletePhoto
    }
) => {
    const {styles} = useStyles()
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
        id: image.id || 0
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div className={styles.draggablePhoto} ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div className={cn(styles.photoBlock, {loading: image.loading})}>
                {index === 0 && (
                    <div className={styles.info}>
                        <StarFilled />
                    </div>
                )}

                {image.loading && (
                    <div className={styles.photoLoading}>
                        <LoadingOutlined />
                    </div>
                )}

                {image?.size && (
                    <SizeBytesBlock size={image.size} />
                )}

                <div className={styles.close} onClick={() => deletePhoto(image.path)}>
                    <DeleteOutlined />
                </div>

                <img src={image.path} alt={image.name} className={styles.photoImg} draggable={false} />

                <ImageBlockAction image={image} nextHandler={nextHandler} prevHandler={prevHandler} />
            </div>
        </div>
    )
}

export default ImageBlock