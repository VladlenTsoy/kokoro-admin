import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ProductVariantStatusType} from "./ProductVariantStatusType.ts"

export const productVariantStatusApi = createApi({
    reducerPath: "productVariantStatusApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["ProductVariantStatus"],
    endpoints: (builder) => ({
        getProductVariantStatuses: builder.query<ProductVariantStatusType[], void>({
            query: () => "/product-variant-status",
            providesTags: ["ProductVariantStatus"]
        }),
        createProductVariantStatus: builder.mutation<ProductVariantStatusType, Partial<ProductVariantStatusType>>({
            query: (body) => ({
                url: "/product-variant-status",
                method: "POST",
                body
            }),
            invalidatesTags: ["ProductVariantStatus"]
        }),
        updateProductVariantStatus: builder.mutation<ProductVariantStatusType, {
            id: number;
            body: Partial<ProductVariantStatusType>
        }>({
            query: ({id, body}) => ({
                url: `/product-variant-status/${id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: ["ProductVariantStatus"]
        }),
        deleteProductVariantStatus: builder.mutation<void, number>({
            query: (id) => ({
                url: `/product-variant-status/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ProductVariantStatus"]
        })
    })
})

export const {
    useGetProductVariantStatusesQuery,
    useCreateProductVariantStatusMutation,
    useUpdateProductVariantStatusMutation,
    useDeleteProductVariantStatusMutation
} = productVariantStatusApi