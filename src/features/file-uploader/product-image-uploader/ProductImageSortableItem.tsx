import React from "react"
import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import ProductImageItem from "./ProductImageItem.tsx"
import type {ProductTemporaryImageType} from "./ProductImageUploaderType.ts"

interface Props {
    id: number
    image: ProductTemporaryImageType
    index: number
    removePhoto: (path: string) => void
}

const ProductImageSortableItem: React.FC<Props> = ({id, image, index, removePhoto}) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({id})

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        transformOrigin: "0 0",
        ...(index === 0 && {gridColumnStart: "span 2"})
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <ProductImageItem
                url={image.path}
                loading={image.loading}
                size={image.size}
                isFirst={index === 0}
                isDragging={isDragging}
                removePhoto={removePhoto}
            />
        </div>
    )
}

export default ProductImageSortableItem