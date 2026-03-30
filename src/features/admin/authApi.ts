import {createApi} from "@reduxjs/toolkit/query/react"
import type {AuthResponse, EmployeeSafe} from "../auth/authTypes.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

interface LoginRequest {
    email: string
    password: string
}

interface RefreshRequest {
    refreshToken: string
}

interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

interface LogoutRequest {
    refreshToken: string
}

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Me"],
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (body) => ({
                url: "auth/login",
                method: "POST",
                body
            })
        }),
        refresh: builder.mutation<AuthResponse, RefreshRequest>({
            query: (body) => ({
                url: "auth/refresh",
                method: "POST",
                body
            })
        }),
        getMe: builder.query<EmployeeSafe, void>({
            query: () => "auth/me",
            providesTags: [{type: "Me", id: "CURRENT"}]
        }),
        changePassword: builder.mutation<{message: string}, ChangePasswordRequest>({
            query: (body) => ({
                url: "auth/change-password",
                method: "PATCH",
                body
            })
        }),
        logout: builder.mutation<{message: string}, LogoutRequest>({
            query: (body) => ({
                url: "auth/logout",
                method: "POST",
                body
            })
        })
    })
})

export const {
    useLoginMutation,
    useRefreshMutation,
    useGetMeQuery,
    useChangePasswordMutation,
    useLogoutMutation
} = authApi
