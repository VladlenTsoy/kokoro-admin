export interface OrderStatusNotification {
    id: number
    statusId: number
    type: "sms" | "email" | "push" | "telegram" | "webhook"
    sendTo: "client" | "manager" | "courier" | "admin"
    template: string
    isActive: boolean
}

export interface OrderStatusNotificationLog {
    id: number
    orderId: number
    status: "queued" | "sent" | "failed" | "skipped"
    error?: string | null
    recipient?: string | null
    createdAt: string
}
