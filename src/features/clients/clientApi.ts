import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"
import type {AdminClient, AdminClientDetails, AdminClientsResponse} from "./clientTypes.ts"

const toQueryString = (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value))
        }
    })
    return query.toString()
}

export const clientApi = createApi({
    reducerPath: "clientApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Client"],
    endpoints: (builder) => ({
        getClients: builder.query<AdminClientsResponse, {search?: string; isActive?: "true" | "false"; page?: number; pageSize?: number}>({
            query: ({search, isActive, page = 1, pageSize = 20}) => ({
                url: `/clients?${toQueryString({search, isActive, page, pageSize})}`
            }),
            providesTags: ["Client"]
        }),
        getClientById: builder.query<AdminClientDetails, number>({
            query: (id) => ({url: `/clients/${id}`}),
            providesTags: (_result, _error, id) => [{type: "Client", id}]
        }),
        updateClient: builder.mutation<AdminClient, {id: number; body: {name?: string; phone?: string; isActive?: boolean}}>({
            query: ({id, body}) => ({
                url: `/clients/${id}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Client", id}, "Client"]
        }),
        blockClient: builder.mutation<{message: string}, number>({
            query: (id) => ({url: `/clients/${id}/block`, method: "POST"}),
            invalidatesTags: (_result, _error, id) => [{type: "Client", id}, "Client"]
        }),
        unblockClient: builder.mutation<{message: string}, number>({
            query: (id) => ({url: `/clients/${id}/unblock`, method: "POST"}),
            invalidatesTags: (_result, _error, id) => [{type: "Client", id}, "Client"]
        }),
        getClientOrders: builder.query<unknown[], number>({
            query: (id) => ({url: `/clients/${id}/orders`}),
            providesTags: (_result, _error, id) => [{type: "Client", id}]
        }),
        getClientAddresses: builder.query<unknown[], number>({
            query: (id) => ({url: `/clients/${id}/addresses`}),
            providesTags: (_result, _error, id) => [{type: "Client", id}]
        }),
        getClientBonusTransactions: builder.query<unknown[], number>({
            query: (id) => ({url: `/clients/${id}/bonus-transactions`}),
            providesTags: (_result, _error, id) => [{type: "Client", id}]
        }),
        mergeClients: builder.mutation<{message: string}, {sourceClientId: number; targetClientId: number}>({
            query: (body) => ({url: "/clients/merge", method: "POST", body}),
            invalidatesTags: ["Client"]
        })
    })
})

export const {
    useGetClientsQuery,
    useGetClientByIdQuery,
    useUpdateClientMutation,
    useBlockClientMutation,
    useUnblockClientMutation,
    useGetClientOrdersQuery,
    useGetClientAddressesQuery,
    useGetClientBonusTransactionsQuery,
    useMergeClientsMutation
} = clientApi
