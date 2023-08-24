import {Moment} from "moment"

export type StatusTypes = "draft" | "published" | "archive" | "ending"

export interface ProductFormData {
    category_id: number
    color_id: number
    title: string
    price: number
    discount?: number
    end_at?: Moment
    home_position?: number
    is_new?: boolean
    sizes?: number[]
    size_props: {[id: number]: {qty: number, cost_price: number, min_qty: number}}
    measurements?: {
        id?: undefined | number
        title: string
        descriptions: {[sizeId: number]: string}
    }[]
    properties?: {title: string; description: string}[]
    save_properties?: string[]
    status: StatusTypes
    tags_id?: string[]
}

export interface CreateDataParams {
    title: string
    category_id: number
    color_id: number
    discount?: undefined
    end_at?: undefined
    home_position?: number
    is_new?: number
    measurements: []
    price: number
    properties: []
    sizes: {size_id: number, qty: number, cost_price: number, min_qty: number}[]
    save_properties: number[]
    status: StatusTypes
    tags_id: number[]
}

export  interface EditDataParams extends CreateDataParams {
    id: number
    product_id: number
}

export interface TemporaryImageType {
    id: number
    imageUrl: string
    loading: boolean
    isSaved?: boolean
    imagePath?: string
    imageName?: string
    imageSize?: number
}

export interface SelectProductsFilterParams {
    categoryIds: number[]
    pagination: {current: number, pageSize: number}
    search: string
    sizeIds: number[]
    sorter: {field: string, order: string}
    type: string
}
