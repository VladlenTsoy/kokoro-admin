import {createApi} from "@reduxjs/toolkit/query/react"
import type {ProductType} from "./ProductType.ts"
import type {CreateProductType} from "./CreateProductType.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export const productApi = createApi({
    reducerPath: "productApi",
    baseQuery: addFileUploaderApi,
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
        createProduct: builder.mutation<ProductType, Partial<CreateProductType>>({
            query: (body) => ({
                url: "/product-variant",
                method: "POST",
                body
            }),
            invalidatesTags: ["Product"]
        }),
        getProductById: builder.query({
            query: () => ({
                url: "/product-variant/:id"
            })
        })
    })
})

export const {
    useCreateProductMutation,
    useGetProductsQuery
} = productApi
