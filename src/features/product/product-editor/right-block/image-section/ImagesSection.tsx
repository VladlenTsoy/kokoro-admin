import React, {type Dispatch, type SetStateAction, useCallback} from "react"
import {Card, Divider, Typography} from "antd"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core"
import {arrayMove, horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable"
import AddPhotoBlock from "./AddImageBlock"
import {getBase64} from "../../../../../utils/getBase64"
import {useDeletePhotoMutation, useUploadPhotoMutation} from "../../../../file-uploader/fileUploaderApi"
import type {DragEndEvent} from "@dnd-kit/core/dist/types"
import SortableImageBlock from "./SortableImageBlock"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    dragDropPhotos: {
        width: "100%",
        flex: 1,
        display: "flex",
        overflow: "hidden",
        overflowX: "auto",
        paddingBottom: token.paddingXL
    },
    droppablePhotos: {
        display: "flex",
        gap: "1rem",
        minHeight: "min-content"
    }
}))

export interface TemporaryImageType {
    id: number;
    path: string;
    size?: number;
    loading?: boolean;
    key: string; // уникальный строковый ключ — будем его использовать для dnd
    name?: string;
    position?: number;
}

const {Title} = Typography

interface ImagesSectionProps {
    imageUrls: TemporaryImageType[];
    setImageUrl: Dispatch<SetStateAction<TemporaryImageType[]>>;
}

const ImagesSection: React.FC<ImagesSectionProps> = ({imageUrls, setImageUrl}) => {
    const {styles} = useStyles()

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}))

    const [uploadPhoto] = useUploadPhotoMutation()
    const [deletePhoto] = useDeletePhotoMutation()

    // Единый id для сортировки — используем строковый key
    const getItemKey = (img: TemporaryImageType) => String(img.id)

    const onDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        if (!over) return
        if (active.id === over.id) return

        setImageUrl((items) => {
            const oldIndex = items.findIndex((img) => getItemKey(img) === String(active.id))
            const newIndex = items.findIndex((img) => getItemKey(img) === String(over.id))

            if (oldIndex === -1 || newIndex === -1) return items
            return arrayMove(items, oldIndex, newIndex)
        })
    }

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

    const moveNext = useCallback((id: number) => {
        setImageUrl(prev => {
            const idx = prev.findIndex(i => i.id === id)
            if (idx === -1 || idx === prev.length - 1) return prev
            return arrayMove(prev, idx, idx + 1)
        })
    }, [setImageUrl])

    const movePrev = useCallback((id: number) => {
        setImageUrl(prev => {
            const idx = prev.findIndex(i => i.id === id)
            if (idx <= 0) return prev
            return arrayMove(prev, idx, idx - 1)
        })
    }, [setImageUrl])

    return (
        <Card>
            <Title level={3}>Фотографии</Title>
            <Divider size="small" />
            <div className={styles.dragDropPhotos}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={imageUrls.map(getItemKey)} strategy={horizontalListSortingStrategy}>
                        <div className={styles.droppablePhotos}>
                            {imageUrls.map((image, key) => {
                                const id = getItemKey(image)
                                return (
                                    <SortableImageBlock
                                        key={id}
                                        image={image}
                                        index={key}
                                        deletePhoto={removeTemporaryPhotoHandler}
                                        nextHandler={moveNext}
                                        prevHandler={movePrev}
                                    />
                                )
                            })}
                            <AddPhotoBlock addPhoto={addPhotoHandler} />
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </Card>
    )
}

export default ImagesSection
