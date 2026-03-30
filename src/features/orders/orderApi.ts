import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi, publicApiUrl} from "../../utils/appApiConfig.ts"
import type {AdminOrder, AdminOrdersResponse} from "./OrderTypes.ts"

export const orderApi = createApi({
    reducerPath: "orderApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Order"],
    endpoints: (builder) => ({
        getOrders: builder.query<AdminOrdersResponse, {page?: number; pageSize?: number}>({
            query: ({page = 1, pageSize = 20}) => ({
                url: `/orders?page=${page}&pageSize=${pageSize}`
            }),
            providesTags: ["Order"]
        }),
        getOrderById: builder.query<AdminOrder | null, number>({
            query: (id) => ({
                // legacy detail endpoint
                url: `${publicApiUrl}/orders/${id}`
            }),
            providesTags: (_result, _error, id) => [{type: "Order", id}]
        })
    })
})

export const {
    useGetOrdersQuery,
    useGetOrderByIdQuery
} = orderApi
