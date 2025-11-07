import React from "react"
import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import PhotoBlock from "./ImageBlock"
import type {TemporaryImageType} from "./ImagesSection"

interface Props {
    id: string; // <- строковый id
    image: TemporaryImageType;
    index: number;
    deletePhoto: (keyOrPath: string) => void;
}

const SortableImageBlock: React.FC<Props> = ({id, image, index, deletePhoto}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id})

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform) || undefined,
        transition: transition || undefined,
        touchAction: "none",
        userSelect: "none",
        willChange: "transform",
        cursor: isDragging ? "grabbing" : "grab",
        // чтобы DragOverlay не перекрывал взаимодействие, можно добавить zIndex при isDragging
        zIndex: isDragging ? 9999 : undefined
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {/* listeners можно вешать на весь блок, либо внутри PhotoBlock на конкретную ручку */}
            <div {...listeners}>
                <PhotoBlock image={image} index={index} deletePhoto={deletePhoto} />
            </div>
        </div>
    )
}

export default SortableImageBlock
