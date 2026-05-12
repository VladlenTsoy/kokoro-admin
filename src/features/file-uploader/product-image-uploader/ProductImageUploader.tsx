import React, {type Dispatch, type SetStateAction, useCallback, useState} from "react"
import {createStyles} from "antd-style"
import type {ProductTemporaryImageType} from "./ProductImageUploaderType.ts"
import ProductImageSortableItem from "./ProductImageSortableItem.tsx"
import ProductImageUploaderButton from "./ProductImageUploaderButton.tsx"
import {Alert} from "antd"
import ProductImageDragContext from "./ProductImageDragContext.tsx"
import {getBase64} from "../../../utils/getBase64.ts"
import {useUploadPhotoMutation} from "../fileUploaderApi.ts"

const useStyles = createStyles(() => ({
    guidance: {
        marginBottom: 12
    },
    grid: {
        width: "100%",
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridGap: 12
    }
}))

interface ProductImageUploaderProps {
    imageUrls: ProductTemporaryImageType[];
    setImageUrl: Dispatch<SetStateAction<ProductTemporaryImageType[]>>;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({imageUrls, setImageUrl}) => {
    const {styles} = useStyles()
    const [activeId, setActiveId] = useState<number | null>(null)

    const [uploadPhoto] = useUploadPhotoMutation()

    const addPhotoHandler = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ""

            if (files.length) {
                files.forEach(file => {
                    getBase64(file, async (imageUrl) => {
                        const timeKey = Math.round(Date.now() + Math.random()) // уникальный id

                        if (imageUrl)
                            setImageUrl(prev => [
                                ...prev,
                                {
                                    tmp_id: timeKey,
                                    url: imageUrl,
                                    loading: true
                                }
                            ])

                        const formData = new FormData()
                        formData.append("file", file)
                        try {
                            const data = await uploadPhoto(formData).unwrap()

                            setImageUrl(prev =>
                                prev.map(img =>
                                    img.tmp_id === timeKey
                                        ? {
                                            ...img,
                                            loading: false,
                                            name: data.name,
                                            path: data.key,
                                            url: data.location,
                                            size: data.size,
                                            position: img.position
                                        }
                                        : img
                                )
                            )
                        } catch (error) {
                            console.error(error)
                            setImageUrl(prev =>
                                prev.map(img =>
                                    img.tmp_id === timeKey ? {
                                        ...img,
                                        loading: false,
                                        error: true
                                    } : img
                                )
                            )
                        }
                    })
                })
            }
        },
        [uploadPhoto, setImageUrl]
    )

    const removeTemporaryPhotoHandler = useCallback(
        async (image: ProductTemporaryImageType) => {
            setImageUrl((prev) =>
                image.path
                    ? prev.map((img) => img.path === image.path ? {...img, to_delete: true} : img)
                    : prev.filter((img) => img.tmp_id !== image.tmp_id)
            )
        },
        [setImageUrl]
    )

    const visibleImageUrls = imageUrls.filter(item => !item.to_delete)
    const hasUploadErrors = visibleImageUrls.some((item) => item.error)

    return <ProductImageDragContext
        setImageUrl={setImageUrl}
        imageUrls={imageUrls}
        setActiveId={setActiveId}
        activeId={activeId}
    >
        {hasUploadErrors && (
            <Alert
                className={styles.guidance}
                type="warning"
                showIcon
                message="Некоторые фотографии не загрузились"
                description="Удалите ошибочные превью и добавьте файлы ещё раз перед сохранением товара."
            />
        )}
        <div className={styles.grid}>
            {visibleImageUrls
                .map((item, index) => (
                    <ProductImageSortableItem
                        key={item.tmp_id}
                        id={item.tmp_id}
                        image={item}
                        index={index}
                        removePhoto={removeTemporaryPhotoHandler}
                    />
                ))}
            <ProductImageUploaderButton addPhoto={addPhotoHandler} isFirst={visibleImageUrls.length <= 0} />
        </div>
    </ProductImageDragContext>
}

export default ProductImageUploader
