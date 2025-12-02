export interface ProductSizeType {
    id: number
    qty: number
    min_qty: number
    size: {
        id: number
        title: string
    }
}

export interface ProductImageType {
    name: string
    path: string
    size: number
    position: number
}

export interface ProductType {
    title: string
    price: number
    product_id: number
    storage_id: number
    productProperties: number[]
    category_id: number
    color_id: number
    // product_sizes: ProductSizeType[],
    product_images: ProductImageType[],
    tags: []
    //
    sizes: ProductSizeType[]
    is_new: boolean
    color: {
        id: number
        title: string
        hex: string
    }
    status: {
        id: number
        title: string
    }
}

export interface SelectProductsFilterParams {
    categoryIds: number[]
    pagination: {current: number, pageSize: number}
    search: string
    sizeIds: number[]
    sorter: {field: string, order: "ascend" | "descend"}
    type: string
}