export interface ProductCategoryType {
    id: number
    title: string
    parent_category_id: number | null
    url: string
    is_hide: boolean
    deleted_at?: string | null
}


export interface ProductCategoryWithSubCategoryType {
    id: number
    title: string
    parent_category_id: number | null
    url: string
    sub_categories: ProductCategoryWithSubCategoryType[]
    is_hide: boolean
    deleted_at?: string | null
}