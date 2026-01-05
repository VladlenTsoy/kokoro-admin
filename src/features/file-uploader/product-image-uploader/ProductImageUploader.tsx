import React, {type Dispatch, type SetStateAction, useCallback, useState} from "react"
import {createStyles} from "antd-style"
import type {ProductTemporaryImageType} from "./ProductImageUploaderType.ts"
import ProductImageSortableItem from "./ProductImageSortableItem.tsx"
import ProductImageUploaderButton from "./ProductImageUploaderButton.tsx"
import ProductImageDragContext from "./ProductImageDragContext.tsx"
import {getBase64} from "../../../utils/getBase64.ts"
import {useDeletePhotoMutation, useUploadPhotoMutation} from "../fileUploaderApi.ts"

const useStyles = createStyles(() => ({
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
    const [deletePhoto] = useDeletePhotoMutation()

    const addPhotoHandler = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e?.target?.files?.length) {
                Array.from(e.target.files).forEach(file => {
                    getBase64(file, async (imageUrl) => {
                        const timeKey = Math.round(Date.now() + Math.random()) // уникальный id

                        if (imageUrl)
                            setImageUrl(prev => [
                                ...prev,
                                {
                                    id: timeKey,
                                    key: String(timeKey),
                                    path: imageUrl,
                                    loading: true
                                }
                            ])

                        const formData = new FormData()
                        formData.append("file", file)
                        const res = await uploadPhoto(formData)

                        if (res?.data) {
                            const data = res.data
                            setImageUrl(prev =>
                                prev.map(img =>
                                    img.key === String(timeKey)
                                        ? {
                                            ...img,
                                            loading: false,
                                            name: data.name,
                                            path: data.location,
                                            size: data.size,
                                            position: img.position,
                                            key: data.key
                                        }
                                        : img
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
        async (keyOrPath: string) => {
            // mark loading
            setImageUrl((prev) =>
                prev.map((img) =>
                    (img.key === keyOrPath || img.path === keyOrPath ? {...img, loading: true} : img)
                )
            )
            // find image by key or path
            const findImage = imageUrls.find((img) => img.key === keyOrPath || img.path === keyOrPath)

            if (findImage) {
                await deletePhoto({path: findImage.key}) // backend expects key
                setImageUrl((prev) => prev.filter((img) => img.key !== findImage.key))
            }
        },
        [deletePhoto, setImageUrl, imageUrls]
    )

    return <ProductImageDragContext
        setImageUrl={setImageUrl}
        imageUrls={imageUrls}
        setActiveId={setActiveId}
        activeId={activeId}
    >
        <div className={styles.grid}>
            {imageUrls.map((item, index) => (
                <ProductImageSortableItem
                    key={item.id}
                    id={item.id}
                    image={item}
                    index={index}
                    removePhoto={removeTemporaryPhotoHandler}
                />
            ))}
            <ProductImageUploaderButton addPhoto={addPhotoHandler} isFirst={imageUrls.length <= 0} />
        </div>
    </ProductImageDragContext>
}

export default ProductImageUploader
