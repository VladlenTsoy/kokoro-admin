import {
    fetchBaseQuery,
    type BaseQueryFn,
    type FetchArgs,
    type FetchBaseQueryError
} from "@reduxjs/toolkit/query/react"
import {clearAuthData, setAuthData} from "../features/auth/authSlice.ts"

const adminApiBaseUrl = import.meta.env.VITE_API_ADMIN_URL
const publicApiBaseUrl = adminApiBaseUrl.replace(/\/admin\/?$/, "")

const adminBaseQuery = fetchBaseQuery({
    baseUrl: adminApiBaseUrl,
    prepareHeaders: (headers, {getState}) => {
        const state = getState() as {auth?: {accessToken?: string | null; tokenType?: string}}
        const accessToken = state.auth?.accessToken
        const tokenType = state.auth?.tokenType ?? "Bearer"

        if (accessToken) {
            headers.set("Authorization", `${tokenType} ${accessToken}`)
        }

        headers.set("Content-Type", "application/json")
        return headers
    }
})

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await adminBaseQuery(args, api, extraOptions)
    const url = typeof args === "string" ? args : args.url
    const isAuthPublicCall = ["auth/login", "auth/refresh"].some((path) => url.includes(path))

    if (result.error?.status === 401 && !isAuthPublicCall) {
        const state = api.getState() as {auth?: {refreshToken?: string | null}}
        const refreshToken = state.auth?.refreshToken

        if (!refreshToken) {
            api.dispatch(clearAuthData("session_expired"))
            return result
        }

        const refreshResult = await adminBaseQuery(
            {
                url: "auth/refresh",
                method: "POST",
                body: {refreshToken}
            },
            api,
            extraOptions
        )

        if (refreshResult.data) {
            api.dispatch(setAuthData(refreshResult.data as Parameters<typeof setAuthData>[0]))
            result = await adminBaseQuery(args, api, extraOptions)
        } else {
            api.dispatch(clearAuthData("session_expired"))
        }
    }

    return result
}

export const addFileUploaderApi = baseQueryWithReauth
export const publicApiBaseQuery = fetchBaseQuery({baseUrl: publicApiBaseUrl})

export const adminApiUrl = adminApiBaseUrl
export const publicApiUrl = publicApiBaseUrl
export const domainUrlForImage = import.meta.env.VITE_CDN_URL
