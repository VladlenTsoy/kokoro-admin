import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {SalesPointType, SalesPointWithStoragesType} from "./SalesPointTypes.ts"

export const salesPointApi = createApi({
    reducerPath: "salesPointApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["SalesPoint", "SalesPointWithStorage"],
    endpoints: (builder) => ({
        getSalesPoints: builder.query<SalesPointType[], void>({
            query: () => "/sales-points",
            providesTags: ["SalesPoint"]
        }),
        getSalesPointsWithStorages: builder.query<SalesPointWithStoragesType[], void>({
            query: () => "/sales-points/with-storages",
            providesTags: ["SalesPointWithStorage"]
        }),
        createSalesPoint: builder.mutation<SalesPointType, Partial<SalesPointType>>({
            query: (body) => ({
                url: "/sales-points",
                method: "POST",
                body
            }),
            invalidatesTags: ["SalesPoint", "SalesPointWithStorage"]
        }),
        updateSalesPoint: builder.mutation<SalesPointType, {id: number; body: Partial<SalesPointType>}>({
            query: ({id, body}) => ({
                url: `/sales-points/${id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: ["SalesPoint", "SalesPointWithStorage"]
        }),
        deleteSalesPoint: builder.mutation<void, number>({
            query: (id) => ({
                url: `/sales-points/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["SalesPoint", "SalesPointWithStorage"]
        })
    })
})

export const {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation,
    useGetSalesPointsWithStoragesQuery
} = salesPointApi
