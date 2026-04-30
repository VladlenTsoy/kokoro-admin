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

export interface AdminClientDetails extends AdminClient {
    addresses?: Array<{
        id: number
        address: string
        location?: {lat: number; lng: number}
    }>
}
