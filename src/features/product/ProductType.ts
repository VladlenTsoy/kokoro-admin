export interface ProductSizeType {
    size_id: number
    cost_price: number
    qty: number
    min_qty: number
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
    productProperties: []
    category_id: number
    color_id: number
    product_sizes: ProductSizeType[],
    product_images: ProductImageType[],
    tags: []
}