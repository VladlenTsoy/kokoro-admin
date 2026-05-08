import type React from "react"
import {Tag, Tooltip} from "antd"
import type {ProductType} from "../../ProductType.ts"

interface Props {
    product: ProductType
}

const ProductTableAvailabilityColumn: React.FC<Props> = ({product}) => {
    const isHidden = product.status?.id !== 2
    const totalQty = (product.sizes || []).reduce((sum, size) => sum + Number(size.qty || 0), 0)
    const reservedQty = (product.sizes || []).reduce((sum, size) => sum + Number(size.reservedQty || 0), 0)
    const availableQty = Math.max(totalQty - reservedQty, 0)

    if (isHidden) {
        return <Tag color="default">Скрыт</Tag>
    }

    if (availableQty <= 0) {
        return (
            <Tooltip title={`Остаток: ${totalQty}; резерв: ${reservedQty}`}>
                <Tag color="red">Недоступен</Tag>
            </Tooltip>
        )
    }

    return (
        <Tooltip title={`Доступно: ${availableQty}; резерв: ${reservedQty}`}>
            <Tag color="green">Доступен</Tag>
        </Tooltip>
    )
}

export default ProductTableAvailabilityColumn
