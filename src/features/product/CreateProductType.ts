export interface CreateProductType {
    title: string
    price: number
    product_id: number
    discount: {
        discount_percent?: number
        end_date?: string
    }
    storage_id: number
    product_properties: number[]
    category_id: number
    status_id: number
    color_id: number
    product_images: {
        name: string
        path: string
        size: number
        position?: number
    }[],
    tags: string[]
    product_sizes: {
        size_id: number
        qty: number
        cost_price: number
        min_qty: number
    }[]
    is_new: boolean
    measurements: {
        id?: number
        title: string
        description: Record<number, string>
    }[]
}