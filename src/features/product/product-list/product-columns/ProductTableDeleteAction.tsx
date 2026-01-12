import React from "react"
import {Button, Modal} from "antd"
import {DeleteOutlined} from "@ant-design/icons"
import {useDeleteByProductIdMutation} from "../../productApi.ts"

interface Props {
    productId: number
}

const ProductTableDeleteAction: React.FC<Props> = ({productId}) => {
    const [removeById] = useDeleteByProductIdMutation()

    const onRemoveHandler = () => {
        Modal.confirm({
            title: "Вы уверены что хотите удалить продукт?",
            onOk: async () => {
                await removeById(productId)
            }
        })
    }

    return (
        <Button danger icon={<DeleteOutlined />} onClick={onRemoveHandler} />
    )
}

export default ProductTableDeleteAction