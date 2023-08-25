import { ProductColor } from "../types/product/ProductColor"

export const formatPrice = (price: number | string, discount?: ProductColor["discount"] | number): string => {
    let totalPrice = Number(price)

    if (discount) {
        if (typeof discount === "number") {
            totalPrice = Math.round(totalPrice - (totalPrice / 100) * discount)
        } else {
            totalPrice = Math.round(totalPrice - (totalPrice / 100) * discount.discount)
        }
    }

    return Math.round(totalPrice)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export const checkDiscount = (price: number, discount?: ProductColor["discount"]): number => {
    if (discount) return Math.round(price - (price / 100) * discount.discount)
    return price
}
