import {createApi} from "@reduxjs/toolkit/query/react"
import type {ProductVariantTagType} from "./ProductVariantTagType.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export const productVariantTagApi = createApi({
    reducerPath: "productVariantTagApi",
    baseQuery: addFileUploaderApi,
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
