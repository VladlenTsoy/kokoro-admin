import React from "react"
import {Button, Modal, Typography} from "antd"
import {DeleteOutlined, ExclamationCircleOutlined} from "@ant-design/icons"

interface Props {
    productId: number
    productTitle?: string
    disabled?: boolean
    isDeleting?: boolean
    onDelete: (productId: number) => Promise<void>
}

const ProductTableDeleteAction: React.FC<Props> = ({productId, productTitle, disabled, isDeleting, onDelete}) => {
    const onRemoveHandler = () => {
        Modal.confirm({
            title: "Удалить товар из каталога?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <Typography.Paragraph style={{marginBottom: 0}}>
                    {productTitle ? <>«{productTitle}» будет удалён из админ-каталога.</> : "Товар будет удалён из админ-каталога."} Перед подтверждением проверьте, что он не используется в активных продажах, промо или витрине.
                </Typography.Paragraph>
            ),
            okText: isDeleting ? "Удаляем…" : "Удалить товар",
            okButtonProps: {danger: true, loading: isDeleting},
            cancelText: "Оставить",
            onOk: () => onDelete(productId)
        })
    }

    return (
        <Button
            danger
            icon={<DeleteOutlined />}
            loading={isDeleting}
            disabled={disabled}
            aria-label={productTitle ? `Удалить товар ${productTitle}` : `Удалить товар #${productId}`}
            onClick={onRemoveHandler}
        />
    )
}

export default ProductTableDeleteAction
