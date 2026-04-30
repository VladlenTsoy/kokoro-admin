import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"
import type {OrderStatusNotification, OrderStatusNotificationLog} from "./orderNotificationTypes.ts"

export const orderNotificationApi = createApi({
    reducerPath: "orderNotificationApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["OrderNotification"],
    endpoints: (builder) => ({
        getOrderStatusNotifications: builder.query<OrderStatusNotification[], void>({
            query: () => ({url: "/order-status-notifications"}),
            providesTags: ["OrderNotification"]
        }),
        createOrderStatusNotification: builder.mutation<OrderStatusNotification, Partial<OrderStatusNotification>>({
            query: (body) => ({url: "/order-status-notifications", method: "POST", body}),
            invalidatesTags: ["OrderNotification"]
        }),
        updateOrderStatusNotification: builder.mutation<OrderStatusNotification, {id: number; body: Partial<OrderStatusNotification>}>({
            query: ({id, body}) => ({url: `/order-status-notifications/${id}`, method: "PATCH", body}),
            invalidatesTags: ["OrderNotification"]
        }),
        deleteOrderStatusNotification: builder.mutation<{message: string}, number>({
            query: (id) => ({url: `/order-status-notifications/${id}`, method: "DELETE"}),
            invalidatesTags: ["OrderNotification"]
        }),
        getOrderStatusNotificationLogs: builder.query<OrderStatusNotificationLog[], void>({
            query: () => ({url: "/order-status-notifications/logs"}),
            providesTags: ["OrderNotification"]
        }),
        getOrderStatusNotificationLogsByOrder: builder.query<OrderStatusNotificationLog[], number>({
            query: (orderId) => ({url: `/order-status-notifications/logs/order/${orderId}`}),
            providesTags: ["OrderNotification"]
        })
    })
})

export const {
    useGetOrderStatusNotificationsQuery,
    useCreateOrderStatusNotificationMutation,
    useUpdateOrderStatusNotificationMutation,
    useDeleteOrderStatusNotificationMutation,
    useGetOrderStatusNotificationLogsQuery,
    useGetOrderStatusNotificationLogsByOrderQuery
} = orderNotificationApi
