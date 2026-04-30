export type PermissionModuleCode =
    | "dashboard"
    | "orders"
    | "clients"
    | "catalog"
    | "marketing"
    | "settings"
    | "staff"
    | "files"

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage"

export type PermissionCode = `${PermissionModuleCode}.${PermissionAction}`

export interface PermissionCatalogModule {
    code: PermissionModuleCode
    title: string
    description: string
    permissions: {
        code: PermissionCode
        action: PermissionAction
        title: string
    }[]
}

export interface Role {
    id: number
    code: string
    name: string
    isActive: boolean
    permissions: PermissionCode[]
    createdAt: string
    updatedAt: string
}

export interface EmployeeSafe {
    id: number
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    isActive: boolean
    permissions: PermissionCode[]
    roles: Role[]
    createdAt: string
    updatedAt: string
}

export interface AuthResponse {
    accessToken: string
    tokenType: "Bearer"
    expiresInMinutes: number
    refreshToken: string
    refreshTokenExpiresInDays: number
    employee: EmployeeSafe
}

export interface NestApiError {
    statusCode?: number
    message?: string | string[]
    error?: string
}
