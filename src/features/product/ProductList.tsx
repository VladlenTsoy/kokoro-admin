import {Table} from "antd"

const ProductList = () => {
    return (
        <div>
            <Table
                size="small"
                loading={isLoading}
                showHeader={false}
                rowKey="id"
                scroll={{x: true}}
                dataSource={data ? data.results : []}
                columns={columns}
                onChange={onChangeHandler}
                pagination={{
                    ...params.pagination,
                    total: data?.total || 0,
                    size: "default"
                }}
                rowClassName="row-product"
            />
        </div>
    )
}

export default ProductList