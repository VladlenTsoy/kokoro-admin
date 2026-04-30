export type ProductTagType =
    | "color_palette"
    | "season"
    | "style"
    | "anime"
    | "material"
    | "fit"
    | "occasion"
    | "custom"

export interface ProductVariantTagType {
    id: number
    title: string
    slug: string
    type: ProductTagType
    colorHex?: string | null
    isActive: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface ProductVariantTagFilters {
    type?: ProductTagType
    isActive?: "true" | "false"
    search?: string
}

export type ProductVariantTagPayload = {
    title: string
    slug?: string
    type?: ProductTagType
    colorHex?: string | null
    isActive?: boolean
    sortOrder?: number
}

export const PRODUCT_TAG_TYPE_LABELS: Record<ProductTagType, string> = {
    color_palette: "Цветовая гамма",
    season: "Сезон",
    style: "Стиль",
    anime: "Аниме / фандом",
    material: "Материал",
    fit: "Посадка",
    occasion: "Повод",
    custom: "Другое"
}

export const PRODUCT_TAG_TYPE_OPTIONS = Object.entries(PRODUCT_TAG_TYPE_LABELS).map(([value, label]) => ({
    value: value as ProductTagType,
    label
}))
