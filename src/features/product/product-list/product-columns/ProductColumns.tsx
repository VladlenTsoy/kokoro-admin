import type {ColumnsType} from "antd/es/table"
import type {ProductType} from "../../ProductType.ts"
import ProductTableImagesColumn from "./ProductTableImagesColumn.tsx"
import {Button, Space} from "antd"
import ProductTableSizesColumn from "./ProductTableSizesColumn.tsx"
import ProductTableStatusColumn from "./ProductTableStatusColumn.tsx"
import {EditOutlined} from "@ant-design/icons"

export const columns: ColumnsType<ProductType> = [
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
        render: (images: ProductType["product_images"]) =>
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
        render: (value: number) => value.toLocaleString() + " сум"
    },
    {
        title: "Статус",
        dataIndex: ["status"],
        key: "status",
        render: (value: ProductType["status"]) => <ProductTableStatusColumn status={value} />
    },
    {
        key: "actions",
        render: () => (
            <Button icon={<EditOutlined />} />
        )
    }
]