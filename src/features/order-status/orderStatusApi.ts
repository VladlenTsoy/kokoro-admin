import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"
import type {OrderStatusEntity} from "./orderStatusTypes.ts"

export const orderStatusApi = createApi({
    reducerPath: "orderStatusApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["OrderStatus"],
    endpoints: (builder) => ({
        getOrderStatuses: builder.query<OrderStatusEntity[], void>({
            query: () => ({url: "/order-statuses"}),
            providesTags: ["OrderStatus"]
        }),
        createOrderStatus: builder.mutation<OrderStatusEntity, Partial<OrderStatusEntity>>({
            query: (body) => ({url: "/order-statuses", method: "POST", body}),
            invalidatesTags: ["OrderStatus"]
        }),
        updateOrderStatusEntity: builder.mutation<OrderStatusEntity, {id: number; body: Partial<OrderStatusEntity>}>({
            query: ({id, body}) => ({url: `/order-statuses/${id}`, method: "PATCH", body}),
            invalidatesTags: ["OrderStatus"]
        }),
        deleteOrderStatusEntity: builder.mutation<{message: string}, number>({
            query: (id) => ({url: `/order-statuses/${id}`, method: "DELETE"}),
            invalidatesTags: ["OrderStatus"]
        }),
        getOrderStatusTransitions: builder.query<OrderStatusEntity[], number>({
            query: (id) => ({url: `/order-statuses/${id}/transitions`}),
            providesTags: ["OrderStatus"]
        }),
        updateOrderStatusTransitions: builder.mutation<{message: string}, {id: number; toStatusIds: number[]}>({
            query: ({id, toStatusIds}) => ({
                url: `/order-statuses/${id}/transitions`,
                method: "PATCH",
                body: {toStatusIds}
            }),
            invalidatesTags: ["OrderStatus"]
        })
    })
})

export const {
    useGetOrderStatusesQuery,
    useCreateOrderStatusMutation,
    useUpdateOrderStatusEntityMutation,
    useDeleteOrderStatusEntityMutation,
    useGetOrderStatusTransitionsQuery,
    useUpdateOrderStatusTransitionsMutation
} = orderStatusApi
