import React from "react"
import type {ProductImageType, ProductType} from "../../ProductType.ts"
import {Badge, Image, Tag, Tooltip} from "antd"
import {PictureOutlined} from "@ant-design/icons"
import {domainUrlForImage} from "../../../../utils/appApiConfig.ts"

interface Props {
    images?: ProductType["images"]
}

const ProductTableImagesColumn: React.FC<Props> = ({images}) => {
    if (!(images && images?.length > 0)) {
        return (
            <Tooltip title="Добавьте главное фото перед публикацией: карточка без изображения хуже продаётся и может выглядеть пустой на витрине.">
                <Tag color="red" icon={<PictureOutlined />}>Нет фото</Tag>
            </Tooltip>
        )
    }

    const previewItems = images.map((image: ProductImageType) => `${domainUrlForImage}${image.path}`)
    const mainImage = images[0]
    const imageAlt = mainImage.name || "Главное фото товара"

    return (
        <Tooltip title={images.length > 1 ? `Фото в карточке: ${images.length}` : "Загружено главное фото"}>
            <Badge count={images.length} size="small" offset={[-2, 4]} color="#1677ff">
                <Image.PreviewGroup items={previewItems}>
                    <Image
                        alt={imageAlt}
                        width={60}
                        src={`${domainUrlForImage}${mainImage.path}`}
                        style={{borderRadius: "10px", objectFit: "cover"}}
                    />
                </Image.PreviewGroup>
            </Badge>
        </Tooltip>
    )
}

export default ProductTableImagesColumn
