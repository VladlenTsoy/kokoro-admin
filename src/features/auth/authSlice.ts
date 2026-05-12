import {createSlice, type PayloadAction} from "@reduxjs/toolkit"
import {useSelector} from "react-redux"
import type {StoreState} from "../store.ts"
import type {AuthResponse, EmployeeSafe} from "./authTypes.ts"
import {can} from "./permissions.ts"

export type AuthNoticeReason = "session_expired" | "manual_logout" | null

interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    tokenType: "Bearer"
    expiresInMinutes: number | null
    refreshTokenExpiresInDays: number | null
    employee: EmployeeSafe | null
    noticeReason: AuthNoticeReason
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    tokenType: "Bearer",
    expiresInMinutes: null,
    refreshTokenExpiresInDays: null,
    employee: null,
    noticeReason: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthData: (state, action: PayloadAction<AuthResponse>) => {
            state.accessToken = action.payload.accessToken
            state.refreshToken = action.payload.refreshToken
            state.tokenType = action.payload.tokenType
            state.expiresInMinutes = action.payload.expiresInMinutes
            state.refreshTokenExpiresInDays = action.payload.refreshTokenExpiresInDays
            state.employee = action.payload.employee
            state.noticeReason = null
        },
        setEmployee: (state, action: PayloadAction<EmployeeSafe>) => {
            state.employee = action.payload
        },
        clearAuthData: (state, action: PayloadAction<AuthNoticeReason | undefined>) => {
            state.accessToken = null
            state.refreshToken = null
            state.tokenType = "Bearer"
            state.expiresInMinutes = null
            state.refreshTokenExpiresInDays = null
            state.employee = null
            state.noticeReason = action.payload ?? null
        }
    }
})

export const {setAuthData, setEmployee, clearAuthData} = authSlice.actions

export default authSlice.reducer

export const useSelectedAuthData = () => useSelector((state: StoreState) => state.auth)

export const useHasPermission = (permission: string) =>
    useSelector((state: StoreState) => can(state.auth.employee?.permissions, permission))
