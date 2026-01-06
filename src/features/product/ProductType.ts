/** ------------ ПРОДУКТ --------------- **/

// Данные о размере продукта
export interface ProductSizeType {
    id: number
    qty: number
    cost_price: number
    min_qty: number
    size: {
        id: number
        title: string
    }
}

// Данные об изображение
export interface ProductImageType {
    id: number
    name: string
    path: string
    size: number
    position: number
}

// Данные о цвете продукта
export interface ProductColorType {
    id: number
    title: string
    hex: string
}

// Данные о статусе
export interface ProductStatusType {
    id: number
    title: string
}

// Основные данные о продукте
export interface ProductType {
    id: number
    title: string
    price: number
    product_id: number
    product: {
        category_id: number
    }
    storage_id: number
    productProperties: number[]
    category_id: number
    status_id: number
    color_id: number
    product_images: ProductImageType[],
    images: ProductImageType[],
    tags: []
    sizes: ProductSizeType[]
    is_new: boolean
    color: ProductColorType
    status: ProductStatusType
}

/** ------------ ФИЛЬТР --------------- **/

export interface SelectProductsFilterParams {
    categoryIds: number[]
    pagination: {current: number, pageSize: number}
    search: string
    sizeIds: number[]
    sorter: {field: string, order: "ascend" | "descend"}
    type: string
}

/** ------------ ФОРМА --------------- **/

export type ProductSizeMapType = Record<
    string,
    {
        size_id: number
        qty: number
        cost_price: number
        min_qty: number
    }
>

export interface ProductFormValuesType {
    title: string
    category_id: number
    color_id: number
    storage_id: number
    size_ids: number[]
    tags_id: string[]
    productProperties: number[]
    //
    price: number
    discount: {
        discount?: number
        end_at?: string
    }
    //
    size_props: ProductSizeMapType
    //
    status_id: number
    is_new: "on" | "off"
}