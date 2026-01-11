import type {Dayjs} from "dayjs"

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
    position?: number
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
        id: number
        category_id: number
        properties?: {id: number}[]
    }
    discount: {
        discountPercent?: number
        endDate?: string
    }
    storage_id: number
    productProperties: number[]
    category_id: number
    status_id: number
    color_id: number
    images: ProductImageType[],
    tags: []
    sizes: ProductSizeType[]
    is_new: boolean
    color: ProductColorType
    status: ProductStatusType
    measurements: {
        id: number
        title: string
        description: Record<number, string>
    }[]
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
        id?: number
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
    product_id?: number
    storage_id: number
    size_ids: number[]
    tags_id: string[]
    product_properties: number[]
    //
    price: number
    discount: {
        percent?: number
        end_at?: Dayjs
    }
    //
    size_props: ProductSizeMapType
    //
    status_id: number
    is_new: boolean
    measurements: {
        id?: number
        title: string
        description: Record<number, string>
    }[]
}

export interface ProductOtherVariantType {
    id: number
    title: string
    color: {
        id: number
        title: string
        hex: string
    }
}