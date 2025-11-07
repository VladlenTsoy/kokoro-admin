import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import PhotoBlock from "./ImageBlock.tsx"
import React from "react"
import type {TemporaryImageType} from "./ImagesSection.tsx"

interface Props {
    image: TemporaryImageType
    index: number
    nextHandler?: (path: string) => void
    prevHandler?: (path: string) => void
    deletePhoto: (path: string) => void
}

const SortableImageBlock:React.FC<Props> = ({image, index, nextHandler, prevHandler, deletePhoto}) => {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: image.path})

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PhotoBlock
                index={index}
                image={image}
                nextHandler={nextHandler}
                prevHandler={prevHandler}
                deletePhoto={deletePhoto}
            />
        </div>
    )
}

export default SortableImageBlock