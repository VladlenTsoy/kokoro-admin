import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"
import type {
    AdminOrder,
    AdminOrdersResponse,
    GetAdminOrdersParams,
    OrderCommentItem,
    OrderHistoryItem,
    OrdersSummaryResponse
} from "./OrderTypes.ts"

const toQueryString = (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value))
        }
    })
    return query.toString()
}

export const orderApi = createApi({
    reducerPath: "orderApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Order"],
    endpoints: (builder) => ({
        getOrdersSummary: builder.query<OrdersSummaryResponse, void>({
            query: () => ({url: "/orders/summary"}),
            providesTags: ["Order"]
        }),
        getOrders: builder.query<AdminOrdersResponse, GetAdminOrdersParams>({
            query: ({
                search,
                statusId,
                paymentMethodId,
                sourceId,
                paymentStatus,
                deliveryStatus,
                problemOnly,
                from,
                to,
                page = 1,
                pageSize = 20
            }) => ({
                url: `/orders?${toQueryString({
                    search,
                    statusId,
                    paymentMethodId,
                    sourceId,
                    paymentStatus,
                    deliveryStatus,
                    problemOnly: problemOnly ? 1 : undefined,
                    from,
                    to,
                    page,
                    pageSize
                })}`
            }),
            providesTags: ["Order"]
        }),
        getOrderById: builder.query<AdminOrder | null, number>({
            query: (id) => ({url: `/orders/${id}`}),
            providesTags: (_result, _error, id) => [{type: "Order", id}]
        }),
        updateOrder: builder.mutation<AdminOrder, {id: number; body: {
            paymentMethodId?: number | null
            sourceId?: number | null
            deliveryTypeId?: number | null
            assignedEmployeeId?: number | null
            clientName?: string
            phone?: string
            comment?: string
            deliveryPrice?: number
        }}>({
            query: ({id, body}) => ({
                url: `/orders/${id}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Order", id}, "Order"]
        }),
        updateOrderStatus: builder.mutation<AdminOrder, {id: number; body: {
            statusId: number
            comment?: string
            visibleForClient?: boolean
        }}>({
            query: ({id, body}) => ({
                url: `/orders/${id}/status`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Order", id}, "Order"]
        }),
        cancelOrder: builder.mutation<AdminOrder, {id: number; reason?: string}>({
            query: ({id, reason}) => ({
                url: `/orders/${id}/cancel`,
                method: "POST",
                body: {reason}
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Order", id}, "Order"]
        }),
        createOrderComment: builder.mutation<OrderCommentItem, {id: number; body: {message: string; visibleForClient?: boolean}}>({
            query: ({id, body}) => ({
                url: `/orders/${id}/comments`,
                method: "POST",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Order", id}, "Order"]
        }),
        getOrderHistory: builder.query<OrderHistoryItem[], number>({
            query: (id) => ({url: `/orders/${id}/history`}),
            providesTags: (_result, _error, id) => [{type: "Order", id}]
        })
    })
})

export const {
    useGetOrdersSummaryQuery,
    useGetOrdersQuery,
    useGetOrderByIdQuery,
    useUpdateOrderMutation,
    useUpdateOrderStatusMutation,
    useCancelOrderMutation,
    useCreateOrderCommentMutation,
    useGetOrderHistoryQuery
} = orderApi
