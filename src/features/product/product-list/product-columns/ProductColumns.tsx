import {useState} from "react"
import type {ColumnsType} from "antd/es/table"
import type {ProductType} from "../../ProductType.ts"
import ProductTableImagesColumn from "./ProductTableImagesColumn.tsx"
import {Button, Space, Tooltip, message} from "antd"
import ProductTableSizesColumn from "./ProductTableSizesColumn.tsx"
import ProductTableStatusColumn from "./ProductTableStatusColumn.tsx"
import ProductTableAvailabilityColumn from "./ProductTableAvailabilityColumn.tsx"
import {EditOutlined} from "@ant-design/icons"
import {Link} from "react-router-dom"
import ProductTableDeleteAction from "./ProductTableDeleteAction.tsx"
import {formatMoney} from "../../../../utils/formatters.ts"
import {getNestErrorMessage} from "../../../../utils/getNestErrorMessage.ts"
import {useCan} from "../../../auth/permissions.ts"
import {useDeleteByProductIdMutation} from "../../productApi.ts"

interface UseProductColumnsOptions {
    actionsDisabled?: boolean
    actionsDisabledReason?: string
}

export const useProductColumns = ({actionsDisabled = false, actionsDisabledReason}: UseProductColumnsOptions = {}): ColumnsType<ProductType> => {
    const canUpdateCatalog = useCan("catalog.update")
    const canDeleteCatalog = useCan("catalog.delete")
    const [deleteProduct, {isLoading: isDeletingProduct}] = useDeleteByProductIdMutation()
    const [deletingProductId, setDeletingProductId] = useState<number | null>(null)

    const onDeleteProduct = async (productId: number) => {
        try {
            setDeletingProductId(productId)
            await deleteProduct(productId).unwrap()
            message.success("Товар удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
            throw error
        } finally {
            setDeletingProductId(null)
        }
    }

    return [
        {
        title: "ID",
        dataIndex: "id",
        key: "id",
        sorter: true,
        width: 70
    },
    {
        title: "Фото",
        dataIndex: "images",
        key: "images",
        render: (images: ProductType["images"]) =>
            <ProductTableImagesColumn images={images} />
    },
    {
        title: "Название",
        dataIndex: "title",
        key: "title",
        sorter: true
    },
    {
        title: "Цвет",
        dataIndex: ["color", "title"],
        key: "color",
        render: (_, record) => (
            <Space>
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: record.color?.hex,
                        border: "1px solid #91959C"
                    }}
                />
                {record.color?.title}
            </Space>
        )
    },
    {
        title: "Размеры",
        key: "sizes",
        dataIndex: "sizes",
        render: (sizes) => (
            <ProductTableSizesColumn sizes={sizes} />
        )
    },
    {
        title: "Цена",
        dataIndex: "price",
        key: "price",
        sorter: true,
        render: (value: number) => formatMoney(value)
    },
    {
        title: "Статус",
        dataIndex: ["status"],
        key: "status",
        render: (value: ProductType["status"]) => <ProductTableStatusColumn status={value} />
    },
    {
        title: "Доступность",
        key: "availability",
        render: (_, record) => <ProductTableAvailabilityColumn product={record} />
    },
    {
        title: "Коллекции",
        key: "collections",
        render: (_, record) => record.collections?.length
            ? record.collections.map((collection) => collection.title).join(", ")
            : "—"
    },
        ...(canUpdateCatalog || canDeleteCatalog
            ? [{
                key: "actions",
                render: (_: unknown, record: ProductType) => {
                    const productStatusLabel = record.status?.title ? `статус: ${record.status.title}` : "статус не указан"
                    const productColorLabel = record.color?.title ? `цвет: ${record.color.title}` : "цвет не указан"
                    const productStockLabel = record.sizes.length
                        ? `остаток: ${record.sizes.reduce((sum, size) => sum + size.qty, 0)}`
                        : "размеры и остаток не указаны"
                    const productActionContext = `товар ${record.title}, ID ${record.id}, ${productStatusLabel}, ${productColorLabel}, ${productStockLabel}`
                    const editProductLabel = `Редактировать ${productActionContext}`
                    const editProductBlockedLabel = `Редактирование временно заблокировано: ${productActionContext}`

                    return (
                        <Space>
                            {canUpdateCatalog && (
                                isDeletingProduct || actionsDisabled ? (
                                    <Tooltip title={actionsDisabledReason || "Редактирование товара заблокировано на время удаления"}>
                                        <Button
                                            icon={<EditOutlined />}
                                            disabled
                                            aria-label={editProductBlockedLabel}
                                            title={actionsDisabledReason || editProductBlockedLabel}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Link to={`/products/product/${record.id}`}>
                                        <Button
                                            icon={<EditOutlined />}
                                            aria-label={editProductLabel}
                                            title={editProductLabel}
                                        />
                                    </Link>
                                )
                            )}
                            {canDeleteCatalog && (
                                <Tooltip title={actionsDisabled && deletingProductId !== record.id ? actionsDisabledReason : undefined}>
                                    <ProductTableDeleteAction
                                        productId={record.id}
                                        productTitle={record.title}
                                        disabled={(isDeletingProduct && deletingProductId !== record.id) || actionsDisabled}
                                        isDeleting={deletingProductId === record.id}
                                        onDelete={onDeleteProduct}
                                    />
                                </Tooltip>
                            )}
                        </Space>
                    )
                }
            } satisfies ColumnsType<ProductType>[number]]
            : [])
    ]
}
