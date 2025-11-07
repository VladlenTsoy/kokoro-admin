import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ProductVariantTagType} from "./ProductVariantTagType.ts"

export const productVariantTagApi = createApi({
    reducerPath: "productVariantTagApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["product-variant-tag"],
    endpoints: build => ({
        getAllTags: build.query<ProductVariantTagType[], void>({
            query: body => ({
                url: `/product-variant-tag`,
                method: "GET",
                body
            }),
            providesTags: ["product-variant-tag"]
        })
    })
})

export const {useGetAllTagsQuery} = productVariantTagApi