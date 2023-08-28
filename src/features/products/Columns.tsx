import React from "react"
import Details from "./Details"
import PreviewImage from "./PreviewImage"
import Sizes from "./Sizes"
import Price from "./Price"
import Status from "./Status"
import {ProductColor} from "../../types/product/ProductColor"

export const Columns = [
    {
        width: "60px",
        dataIndex: "id",
        render: (id: number) => `PC${id}`
    },
    {
        width: "61px",
        dataIndex: ["url_thumbnail"],
        render: (image: string, record: ProductColor) => <PreviewImage image={image} product={record} />
    },
    {
        dataIndex: ["title"],
        render: (title: string, record: ProductColor) => <Details title={title} product={record} />
    },
    {
        dataIndex: ["sizes"],
        render: (sizes: any) => <Sizes sizes={sizes} />
    },
    {
        dataIndex: ["details", "price"],
        render: (price: number, record: any) => <Price discount={record.discount} price={price} />
    },
    {
        dataIndex: "status",
        width: "130px",
        render: (status: "draft" | "published" | "archive" | "ending") => <Status status={status} />
    }
]
