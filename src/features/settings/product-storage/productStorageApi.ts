import {createApi} from "@reduxjs/toolkit/query/react"
import type {ProductStorageType} from "./productStorageTypes"
import {publicApiBaseQuery} from "../../../utils/appApiConfig.ts"

export const productStorageApi = createApi({
    reducerPath: "productStorageApi",
    baseQuery: publicApiBaseQuery,
    tagTypes: ["ProductStorage"],
    endpoints: (builder) => ({
        getStorages: builder.query<ProductStorageType[], void>({
            query: () => "/product-storages",
            providesTags: ["ProductStorage"]
        }),
        createStorage: builder.mutation<ProductStorageType, Partial<ProductStorageType>>({
            query: (body) => ({
                url: "/product-storages",
                method: "POST",
                body
            }),
            invalidatesTags: ["ProductStorage"]
        }),
        updateStorage: builder.mutation<ProductStorageType, {id: number; body: Partial<ProductStorageType>}>({
            query: ({id, body}) => ({
                url: `/product-storages/${id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: ["ProductStorage"]
        }),
        deleteStorage: builder.mutation<void, number>({
            query: (id) => ({
                url: `/product-storages/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ProductStorage"]
        })
    })
})

export const {
    useGetStoragesQuery,
    useCreateStorageMutation,
    useUpdateStorageMutation,
    useDeleteStorageMutation
} = productStorageApi
