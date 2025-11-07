import React, {type Dispatch, type SetStateAction, useCallback} from "react"
import {Card, Divider, Typography} from "antd"
import {Element} from "react-scroll"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core"
import {arrayMove, horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable"
import AddPhotoBlock from "./AddImageBlock.tsx"
import {getBase64} from "../../../../../utils/getBase64"
import {useDeletePhotoMutation, useUploadPhotoMutation} from "../../../../file-uploader/fileUploaderApi.ts"
import type {DragEndEvent} from "@dnd-kit/core/dist/types"
import SortableImageBlock from "./SortableImageBlock.tsx"
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
    id?: number
    path: string,
    size?: number
    loading?: boolean

    name?: string
    position?: number
}

const {Title} = Typography

interface ImagesSectionProps {
    imageUrls: TemporaryImageType[]
    setImageUrl: Dispatch<SetStateAction<TemporaryImageType[]>>
}

const ImagesSection: React.FC<ImagesSectionProps> = ({imageUrls, setImageUrl}) => {
    const {styles} = useStyles()

    // DnD kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}})
    )

    // Мутации
    const [uploadPhoto] = useUploadPhotoMutation()
    const [deletePhoto] = useDeletePhotoMutation()

    // Перемещение фото
    const onDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        if (active.id !== over?.id) {
            setImageUrl((items) => {
                const oldIndex = items.findIndex((img) => img.name === active.id)
                const newIndex = items.findIndex((img) => img.name === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    // Добавление фото
    const addPhotoHandler = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e?.target?.files?.length) {
                const file = e.target.files[0]

                return getBase64(file, async (imageUrl) => {
                    if (imageUrl)
                        setImageUrl((prev) => [...prev, {id: e.timeStamp, path: imageUrl, loading: true}])

                    const formData = new FormData()
                    formData.append("file", file)
                    const res = await uploadPhoto(formData)
                    if (res?.data) {
                        const data = res?.data
                        setImageUrl((prev) =>
                            prev.map((img) => {
                                return img.id === e.timeStamp ? {
                                    id: e.timeStamp,
                                    loading: false,
                                    name: data.name,
                                    path: data.location,
                                    size: data.size,
                                    position: img.position
                                } : img
                            })
                        )
                    }
                })
            }
        },
        [uploadPhoto, setImageUrl]
    )

    // Удаление фото
    const removeTemporaryPhotoHandler = useCallback(
        async (path: string) => {
            // Активировать загрузку
            setImageUrl((prev) =>
                prev.map((img) => (img.path === path ? {...img, loading: true} : img))
            )
            // Найти картинку
            const findImage = imageUrls.find((img) => img.path === path)
            // Если картинка найдена, то удаляем ее
            if (findImage?.path) {
                await deletePhoto({path: findImage.path})
                // Удалить картинку из общего массива
                setImageUrl((prev) => prev.filter((img) => img.path !== path))
            }
        },
        [deletePhoto, setImageUrl, imageUrls]
    )

    return (
        <Card>
            <Element name="photos" className="photos">
                <Title level={2}>Фото товара</Title>
                <Divider />
                <div className={styles.dragDropPhotos}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={imageUrls.map((img) => img.path)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className={styles.droppablePhotos}>
                                {imageUrls.map((image, key) => (
                                    <SortableImageBlock
                                        key={image.path}
                                        image={image}
                                        index={key}
                                        deletePhoto={removeTemporaryPhotoHandler}
                                    />
                                ))}
                                <AddPhotoBlock addPhoto={addPhotoHandler} />
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </Element>
        </Card>
    )
}

export default ImagesSection
