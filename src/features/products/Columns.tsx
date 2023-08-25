import React from "react"
import Details from "./Details"
import PreviewImage from "./PreviewImage"
import Sizes from "./Sizes"
import Price from "./Price"
import Status from "./Status"

export const Columns = [
    {
        width: "60px",
        dataIndex: "id",
        render: (id: number) => `PC${id}`
    },
    {
        width: "61px",
        dataIndex: ["url_thumbnail"],
        render: (image: string, record: any) => <PreviewImage image={image} product={record} />
    },
    {
        dataIndex: ["title"],
        render: (title: any, record: any) => <Details title={title} product={record} />
    },
    {
        render: (_: any, record: any) => <Sizes product={record} />
    },
    {
        dataIndex: ["details", "price"],
        render: (price: any, record: any) => <Price product={record} price={price} />
    },
    {
        dataIndex: "status",
        width: "130px",
        render: (status: "draft" | "published" | "archive" | "ending") => <Status status={status} />
    }
]
