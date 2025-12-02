import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ProductType} from "./ProductType.ts"

export const productApi = createApi({
    reducerPath: "productApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["Product"],
    endpoints: (builder) => ({
        getProducts: builder.query<{items: ProductType[], total: number}, {page: number, pageSize: number, categoryIds?: number[], sizeIds?: number[], search?: string, statusId?: string}>({
            query: ({page, pageSize, categoryIds, sizeIds, search, statusId}) => ({
                url: `/product-variant/all`,
                method: "POST",
                body: {
                    page: page,
                    pageSize: pageSize,
                    categoryIds: categoryIds,
                    sizeIds: sizeIds,
                    search: search,
                    statusId: statusId === "all" ? undefined : statusId
                }
            }),
            providesTags: ["Product"]
        }),
        createProduct: builder.mutation<ProductType, Partial<ProductType>>({
            query: (body) => ({
                url: "/product-variant",
                method: "POST",
                body
            }),
            invalidatesTags: ["Product"]
        })
    })
})

export const {
    useCreateProductMutation,
    useGetProductsQuery
} = productApi
