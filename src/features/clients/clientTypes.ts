export interface AdminClient {
    id: number
    name: string
    phone: string
    isActive: boolean
    bonusBalance?: number
    ordersCount?: number
    totalSpent?: number
    averageCheck?: number
    lastOrderAt?: string | null
    createdAt: string
}

export interface AdminClientsResponse {
    items: AdminClient[]
    total: number
    page: number
    pageSize: number
}

export interface AdminClientAddress {
    id: number
    address: string
    location?: {lat: number; lng: number}
}

export interface AdminClientOrder {
    id: number
    orderNumber?: string
    total?: number
    paymentStatus?: string
    deliveryStatus?: string
    createdAt?: string
    status?: {title?: string}
    paymentMethod?: {title?: string}
    deliveryType?: {title?: string}
    clientAddress?: {address?: string}
}

export interface AdminClientBonusTransaction {
    id: number
    type?: string
    amount?: number
    comment?: string
    createdAt?: string
    order?: {id: number; orderNumber?: string}
}

export interface AdminClientDetails extends AdminClient {
    stats?: {
        ordersCount: number
        totalSpent: number
        averageOrderValue: number
        lastOrderAt?: string | null
    }
    addresses?: AdminClientAddress[]
}

export interface AdminClientOrdersResponse {
    items: AdminClientOrder[]
    total: number
    page: number
    pageSize: number
}
