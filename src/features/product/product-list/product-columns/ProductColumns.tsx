import type {ColumnsType} from "antd/es/table"
import type {ProductType} from "../../ProductType.ts"
import ProductTableImagesColumn from "./ProductTableImagesColumn.tsx"
import {Button, Space} from "antd"
import ProductTableSizesColumn from "./ProductTableSizesColumn.tsx"
import ProductTableStatusColumn from "./ProductTableStatusColumn.tsx"
import {EditOutlined} from "@ant-design/icons"
import {Link} from "react-router-dom"
import ProductTableDeleteAction from "./ProductTableDeleteAction.tsx"
import {formatMoney} from "../../../../utils/formatters.ts"
import {useCan} from "../../../auth/permissions.ts"

export const useProductColumns = (): ColumnsType<ProductType> => {
    const canUpdateCatalog = useCan("catalog.update")
    const canDeleteCatalog = useCan("catalog.delete")

    return [
        {
        title: "ID",
        dataIndex: "id",
        key: "id",
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
        key: "title"
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
        render: (value: number) => formatMoney(value)
    },
    {
        title: "Статус",
        dataIndex: ["status"],
        key: "status",
        render: (value: ProductType["status"]) => <ProductTableStatusColumn status={value} />
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
                render: (_: unknown, record: ProductType) => (
                    <Space>
                        {canUpdateCatalog && (
                            <Link to={`/products/product/${record.id}`}>
                                <Button icon={<EditOutlined />} />
                            </Link>
                        )}
                        {canDeleteCatalog && <ProductTableDeleteAction productId={record.id} />}
                    </Space>
                )
            } satisfies ColumnsType<ProductType>[number]]
            : [])
    ]
}
