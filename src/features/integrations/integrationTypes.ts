export type IntegrationProviderKey = "datra_cdp" | "meta"
export type IntegrationBillingStatus = "free" | "active" | "locked" | "expired"
export type IntegrationRuntimeStatus = "disabled" | "enabled" | "paused" | "error"
export type IntegrationStatus = "billing_locked" | "not_configured" | "paused" | "healthy" | "enabled" | "available"

export type IntegrationEventScope =
    | "customers"
    | "devices"
    | "products"
    | "categories"
    | "branches"
    | "orders"
    | "order_statuses"
    | "events"
    | "promotions"
    | "loyalty"

export interface IntegrationSetting {
    id: number
    providerKey: IntegrationProviderKey
    title: string
    description?: string | null
    isPaid: boolean
    billingStatus: IntegrationBillingStatus
    runtimeStatus: IntegrationRuntimeStatus
    enabled: boolean
    configured: boolean
    healthy: boolean
    enabledScopes?: IntegrationEventScope[] | null
    publicConfig?: Record<string, unknown> | null
    hasSecret: boolean
    lastError?: string | null
    lastHealthCheckAt?: string | null
    enabledAt?: string | null
    billingActiveUntil?: string | null
    status: IntegrationStatus
    createdAt: string
    updatedAt: string
}

export interface UpdateIntegrationPayload {
    enabled?: boolean
    runtimeStatus?: IntegrationRuntimeStatus
    billingStatus?: IntegrationBillingStatus
    billingActiveUntil?: string | null
    enabledScopes?: IntegrationEventScope[]
    publicConfig?: Record<string, unknown>
    apiToken?: string
}
