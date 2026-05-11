import React from "react"
import {Button, Modal, Typography, message} from "antd"
import {DeleteOutlined, ExclamationCircleOutlined} from "@ant-design/icons"
import {useDeleteByProductIdMutation} from "../../productApi.ts"
import {getNestErrorMessage} from "../../../../utils/getNestErrorMessage.ts"

interface Props {
    productId: number
    productTitle?: string
}

const ProductTableDeleteAction: React.FC<Props> = ({productId, productTitle}) => {
    const [removeById, {isLoading}] = useDeleteByProductIdMutation()

    const onRemoveHandler = () => {
        Modal.confirm({
            title: "Удалить товар из каталога?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <Typography.Paragraph style={{marginBottom: 0}}>
                    {productTitle ? <>«{productTitle}» будет удалён из админ-каталога.</> : "Товар будет удалён из админ-каталога."} Перед подтверждением проверьте, что он не используется в активных продажах, промо или витрине.
                </Typography.Paragraph>
            ),
            okText: "Удалить товар",
            okButtonProps: {danger: true},
            cancelText: "Оставить",
            onOk: async () => {
                try {
                    await removeById(productId).unwrap()
                    message.success("Товар удалён")
                } catch (error) {
                    message.error(getNestErrorMessage(error))
                    throw error
                }
            }
        })
    }

    return (
        <Button
            danger
            icon={<DeleteOutlined />}
            loading={isLoading}
            aria-label={productTitle ? `Удалить товар ${productTitle}` : `Удалить товар #${productId}`}
            onClick={onRemoveHandler}
        />
    )
}

export default ProductTableDeleteAction
