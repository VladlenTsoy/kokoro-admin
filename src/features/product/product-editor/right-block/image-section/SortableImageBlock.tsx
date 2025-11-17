import React from "react"
import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import PhotoBlock from "./ImageBlock"
import type {TemporaryImageType} from "./ImagesSection"

interface Props {
    image: TemporaryImageType;
    index: number;
    deletePhoto: (id: string) => void;
    nextHandler?: (id: number) => void
    prevHandler?: (id: number) => void
}

const SortableImageBlock: React.FC<Props> = ({image, index, deletePhoto, nextHandler, prevHandler}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: String(image.id)})

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform) || undefined,
        transition: transition || undefined,
        touchAction: "none",
        userSelect: "none",
        willChange: "transform",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 9999 : undefined
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div {...listeners}>
                <PhotoBlock
                    image={image}
                    index={index}
                    deletePhoto={deletePhoto}
                    nextHandler={nextHandler}
                    prevHandler={prevHandler}
                />
            </div>
        </div>
    )
}

export default SortableImageBlock
