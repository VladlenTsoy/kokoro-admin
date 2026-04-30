export interface PromoCode {
    id: number
    code: string
    discountType: "percent" | "fixed"
    discountValue: number
    minOrderTotal?: number | null
    usageLimit?: number | null
    usedCount?: number
    startsAt?: string | null
    endsAt?: string | null
    isActive: boolean
    createdAt?: string
}
