import {useGetProductsQuery} from "../productApi.ts"
import {Table} from "antd"
import {useGetParams} from "../../../hooks/useProductGetParams.ts"
import {columns} from "./product-columns/ProductColumns.tsx"
import ProductHeaderList from "./product-header-list/ProductHeaderList.tsx"


const ProductList = () => {
    const {params, updateParams} = useGetParams()
    const {current, pageSize} = params.pagination
    const {isLoading, data} = useGetProductsQuery({
        page: current,
        pageSize: pageSize,
        categoryIds: params.categoryIds,
        sizeIds: params.sizeIds,
        search: params.search,
        statusId: params.type
    }, {refetchOnMountOrArgChange: true})
    //
    const onChangeHandler = (pagination: {current?: number, pageSize?: number}) => {
        updateParams("pagination", pagination)
    }

    return (
        <div>
            <ProductHeaderList />
            <Table
                loading={isLoading}
                rowKey="id"
                scroll={{x: true}}
                dataSource={data?.items || []}
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