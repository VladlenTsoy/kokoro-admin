import React from "react"
import type {ProductType} from "../ProductType.ts"
import {Tag, Image} from "antd"

interface Props {
    images?: ProductType["product_images"]
}

const ProductTableImagesColumn: React.FC<Props> = ({images}) => {
    if (!(images && images?.length > 0))
        return <Tag color="red">Нет фото</Tag>

    return (
        <Image.PreviewGroup
            items={images.map((image) => `https://kokoro-app.ams3.cdn.digitaloceanspaces.com/${image.path}`)}
        >
            <Image
                alt={images[0].name}
                width={60}
                src={`https://kokoro-app.ams3.cdn.digitaloceanspaces.com/${images[0].path}`}
                style={{borderRadius: "10px"}}
            />
        </Image.PreviewGroup>
    )
}

export default ProductTableImagesColumn