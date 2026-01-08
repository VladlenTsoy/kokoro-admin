import React, {type Dispatch, type SetStateAction, useMemo} from "react"
import {
    closestCorners,
    DndContext,
    type DragEndEvent,
    DragOverlay,
    MeasuringStrategy,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core"
import {arrayMove, rectSortingStrategy, SortableContext} from "@dnd-kit/sortable"
import ProductImageItem from "./ProductImageItem.tsx"
import type {ProductTemporaryImageType} from "./ProductImageUploaderType.ts"

interface Props {
    children: React.ReactNode
    imageUrls: ProductTemporaryImageType[];
    setImageUrl: Dispatch<SetStateAction<ProductTemporaryImageType[]>>;
    activeId: number | null
    setActiveId: Dispatch<SetStateAction<number | null>>;
}

const ProductImageDragContext: React.FC<Props> = ({children, setActiveId, activeId, imageUrls, setImageUrl}) => {
    const sensors = useSensors(useSensor(PointerSensor))
    const selectedIndexImage = useMemo(() => imageUrls.findIndex(val => val.tmp_id === activeId), [imageUrls, activeId])
    const selectedImage = useMemo(() => imageUrls[selectedIndexImage], [imageUrls, selectedIndexImage])

    const onDragEnd = (event: DragEndEvent) => {
        const {active, over} = event

        if (over && active.id !== over.id) {
            setImageUrl((prev) => {
                const oldIndex = prev.findIndex(val => val.id === active.id)
                const newIndex = prev.findIndex(val => val.id === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
        setActiveId(null)
    }

    const onDragCancel = () => {
        setActiveId(null)
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={({active}) => setActiveId(active.id as number)}
            collisionDetection={closestCorners}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always
                }
            }}
        >
            <SortableContext items={imageUrls.map(img => ({id: img.tmp_id}))} strategy={rectSortingStrategy}>
                {children}
            </SortableContext>
            <DragOverlay adjustScale={true}>
                {activeId && (
                    <ProductImageItem
                        url={selectedImage.url}
                        path={selectedImage?.path}
                        isFirst={selectedIndexImage === 0}
                        isDragging
                    />
                )}
            </DragOverlay>
        </DndContext>
    )
}

export default ProductImageDragContext