export interface Role {
    id: number
    code: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface EmployeeSafe {
    id: number
    email: string
    firstName: string
    lastName: string
    phone: string
    isActive: boolean
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
