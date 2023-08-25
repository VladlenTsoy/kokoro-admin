import {Category} from "../Category"
import {Tag} from "../Tag"

export interface ProductColor {
    id: number | string
    category: {
        id: Category["id"]
        title: Category["title"]
    }
    title: string
    image: string
    properties: {
        title: string
        description: string
    }[]
    color: {
        id: number
        title: string
        hex: string
    }
    discount?: {
        id?: number
        product_color_id?: number
        discount: number
        end_at?: string
    }
    // price: number
    tags_id: Tag["id"][]
    //
    url_images: string[]
    details: {
        id: number
        title: string
        url_image: string
        price: number
    }
    sizes: {
        id: number
        size_id: number
        title: string
        qty: number
        min_qty: number
        cost_price: number
    }[]
    storage: {
        id: number
        title: string
    } | null
    url_thumbnail: string
    is_new: boolean
}
