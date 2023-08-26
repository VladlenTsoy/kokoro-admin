export interface Category {
    id: number
    title: string
    url: string
    hide_id?: number | null
    sub_categories?: SubCategory[]
}

interface SubCategory {
    id: number
    title: string
    url: string
    category_id: number
    hide_id?: number
}

interface CreateCategoryType {
    title: Category["title"]
    category_id?: Category["id"]
}

interface EditCategoryType {
    id: Category["id"]
    data: {
        title: Category["title"]
        category_id?: Category["id"]
        hide_id?: Category["hide_id"]
    }
}
