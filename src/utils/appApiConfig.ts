import {fetchBaseQuery} from "@reduxjs/toolkit/query/react"

const adminApiBaseUrl = import.meta.env.VITE_API_ADMIN_URL
const publicApiBaseUrl = adminApiBaseUrl.replace(/\/admin\/?$/, "")

export const addFileUploaderApi = fetchBaseQuery({baseUrl: adminApiBaseUrl})
export const publicApiBaseQuery = fetchBaseQuery({baseUrl: publicApiBaseUrl})

export const adminApiUrl = adminApiBaseUrl
export const publicApiUrl = publicApiBaseUrl
export const domainUrlForImage = import.meta.env.VITE_CDN_URL
