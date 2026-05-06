export interface OrderStatus {
    id: number
    title: string
    access: string
    fixed: boolean
    position: number
    createdAt: string
}

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type OrderDeliveryStatus = "pending" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled"

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
    itemsCount?: number
    orderNumber?: string
    updatedAt?: string
    deliveryStatus?: OrderDeliveryStatus | null
    paymentStatus?: OrderPaymentStatus | null
    assignedEmployee?: {
        id: number
        firstName: string
        lastName: string
        phone?: string
        email?: string
    } | null
    subtotal?: number
    discountTotal?: number
    promoCode?: string | null
    promoDiscount?: number
    bonusSpent?: number
    bonusEarned?: number
    deliveryPrice?: number
    cancelReason?: string | null
    histories?: OrderHistoryItem[]
    comments?: OrderCommentItem[]
}

export interface AdminOrdersResponse {
    items: AdminOrder[]
    total: number
    page: number
    pageSize: number
}

export interface OrdersSummaryActivityItem {
    id: number
    orderId?: number
    orderNumber?: string
    event?: string
    changedBy?: string
    changedAt?: string
    fromStatus?: string
    toStatus?: string
}

export interface OrdersSummaryResponse {
    ordersToday: number
    newOrders: number
    inProgressToday?: number
    readyToday?: number
    problemToday?: number
    revenueToday: number
    recentActivity?: OrdersSummaryActivityItem[]
}

export interface OrderHistoryItem {
    id: number
    createdAt?: string
    changedAt?: string
    fromStatusId?: number | null
    toStatusId?: number | null
    fromStatus?: OrderStatus | null
    toStatus?: OrderStatus | null
    comment?: string | null
    visibleForClient?: boolean
    createdByEmployeeId?: number | null
    changedBy?: string | null
    employee?: {
        id: number
        firstName: string
        lastName: string
    } | null
}

export interface OrderCommentItem {
    id: number
    message: string
    visibleForClient: boolean
    createdAt: string
    employee?: {
        id: number
        firstName: string
        lastName: string
    } | null
}

export interface GetAdminOrdersParams {
    search?: string
    statusId?: number
    paymentMethodId?: number
    sourceId?: number
    paymentStatus?: OrderPaymentStatus
    deliveryStatus?: OrderDeliveryStatus
    problemOnly?: boolean
    from?: string
    to?: string
    page?: number
    pageSize?: number
}
