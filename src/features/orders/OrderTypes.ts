export interface OrderStatus {
    id: number
    title: string
    access: string
    fixed: boolean
    position: number
    createdAt: string
}

export interface OrderPaymentMethod {
    id: number
    title: string
    isActive: boolean
    createdAt: string
}

export interface OrderSource {
    id: number
    title: string
    code: string
    isActive: boolean
    createdAt: string
}

export interface OrderDeliveryType {
    id: number
    title: string
    description: string
    isActive: boolean
    createdAt: string
}

export interface OrderClient {
    id: number
    name: string
    phone: string
    createdAt: string
}

export interface OrderClientAddress {
    id: number
    address: string
    location: {
        lat: number
        lng: number
    }
    locationHash: string
    createdAt: string
}

export interface OrderItemProductVariant {
    id: number
    title: string
    description?: string
    price: number
}

export interface OrderItemSize {
    id: number
    title: string
}

export interface OrderItem {
    id: number
    qty: number
    price: number
    promotion: boolean
    discount: number
    createdAt: string
    productVariant: OrderItemProductVariant
    size: OrderItemSize | null
}

export interface AdminOrder {
    id: number
    total: number
    phone: string
    clientName: string
    comment: string | null
    createdAt: string
    status: OrderStatus | null
    paymentMethod: OrderPaymentMethod | null
    source: OrderSource | null
    deliveryType: OrderDeliveryType | null
    client: OrderClient | null
    clientAddress: OrderClientAddress | null
    items: OrderItem[]
}

export interface AdminOrdersResponse {
    items: AdminOrder[]
    total: number
}
