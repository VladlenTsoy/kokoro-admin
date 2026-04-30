import {createApi} from "@reduxjs/toolkit/query/react"
import type {
    ProductVariantTagFilters,
    ProductVariantTagPayload,
    ProductVariantTagType
} from "./ProductVariantTagType.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export const productVariantTagApi = createApi({
    reducerPath: "productVariantTagApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["product-variant-tag"],
    endpoints: build => ({
        getAllTags: build.query<ProductVariantTagType[], ProductVariantTagFilters | void>({
            query: (params) => ({
                url: "/product-variant-tag",
                method: "GET",
                params: params || undefined
            }),
            providesTags: ["product-variant-tag"]
        }),
        getTagById: build.query<ProductVariantTagType, number>({
            query: (id) => `/product-variant-tag/${id}`,
            providesTags: (_result, _error, id) => [{type: "product-variant-tag", id}]
        }),
        createTag: build.mutation<ProductVariantTagType, ProductVariantTagPayload>({
            query: (body) => ({
                url: "/product-variant-tag",
                method: "POST",
                body
            }),
            invalidatesTags: ["product-variant-tag"]
        }),
        updateTag: build.mutation<ProductVariantTagType, {id: number; body: Partial<ProductVariantTagPayload>}>({
            query: ({id, body}) => ({
                url: `/product-variant-tag/${id}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => ["product-variant-tag", {type: "product-variant-tag", id}]
        }),
        deleteTag: build.mutation<{message: string}, number>({
            query: (id) => ({
                url: `/product-variant-tag/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["product-variant-tag"]
        })
    })
})

export const {
    useGetAllTagsQuery,
    useGetTagByIdQuery,
    useCreateTagMutation,
    useUpdateTagMutation,
    useDeleteTagMutation
} = productVariantTagApi
