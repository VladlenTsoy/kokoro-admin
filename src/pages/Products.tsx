import React, {useState} from "react"
import {useGetAllProductsQuery} from "../store/productsApi/productsApi"
import {Table} from "antd"

const columns = [
    {
        width: "60px",
        dataIndex: "id"
    },
    {
        width: "61px",
        dataIndex: ["url_thumbnail"]
    },
    {
        dataIndex: ["title"]
    },
    {
        dataIndex: ["details", "price"],
        render: (price: number, record: any) => (
            <div className="price-block">
                {record.discount ? (
                    <>
                        <div className="discount">
                            <div>{record.discount.discount}%</div>
                        </div>
                        <span className="price">{price}</span>
                        <span className="extra"> сум</span>
                    </>
                ) : (
                    <>
                        <span className="price">{price}</span>
                        <span className="extra"> сум</span>
                    </>
                )}
            </div>
        )
    },
    {
        dataIndex: "status",
        width: "130px"
    }
]

const Products: React.FC = () => {
    const [state, setState] = useState({current: 1, pageSize: 50})

    const params = {
        categoryIds: [],
        pagination: state,
        search: "",
        sizeIds: [],
        sorter: {field: "created_at", order: "descend"},
        type: "all"
    }

    const {isLoading, data} = useGetAllProductsQuery(params)
    const onChange = (pagination: any) => {
        setState(pagination)
    }

    return (
        <Table
            size="small"
            loading={isLoading}
            showHeader={true}
            rowKey="id"
            scroll={{x: true}}
            dataSource={data ? data.results : []}
            columns={columns}
            pagination={{
                ...params.pagination,
                total: data?.total || 0,
                size: "default"
            }}
            onChange={onChange}
        />
    )
}

export default Products
