export interface User {
    id: number
    full_name: string
    email: string
    url_photo: string
    access: "admin" | "manager" | "cashier"
}
