import {createApi} from "@reduxjs/toolkit/query/react"
import type {ProductOtherVariantType, ProductType} from "./ProductType.ts"
import type {CreateProductType} from "./CreateProductType.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export const productApi = createApi({
    reducerPath: "productApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Product", "ProductOne"],
    endpoints: (builder) => ({
        getProducts: builder.query<{items: ProductType[], total: number}, {
            page: number,
            pageSize: number,
            categoryIds?: number[],
            sizeIds?: number[],
            search?: string,
            statusId?: string
        }>({
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
        updateProduct: builder.mutation<ProductType, {id: number, data: Partial<CreateProductType>}>({
            query: ({id, data}) => ({
                url: `/product-variant/${id}`,
                method: "POST",
                body: data
            }),
            invalidatesTags: ["Product", "ProductOne"]
        }),
        getProductById: builder.query<ProductType, string | undefined>({
            query: (id) => ({
                url: `/product-variant/${id}`
            }),
            providesTags: ["ProductOne"]
        }),
        getOthersVariantsByProductById: builder.query<ProductOtherVariantType[], string | undefined>({
            query: (id) => ({
                url: `/product-variant/${id}/variants`
            }),
            providesTags: ["Product", "ProductOne"]
        }),
        deleteByProductId: builder.mutation<{message: string}, number | undefined>({
            query: (id) => ({
                url: `/product-variant/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Product", "ProductOne"]
        })
    })
})

export const {
    useCreateProductMutation,
    useGetProductsQuery,
    useGetProductByIdQuery,
    useGetOthersVariantsByProductByIdQuery,
    useUpdateProductMutation,
    useDeleteByProductIdMutation
} = productApi
