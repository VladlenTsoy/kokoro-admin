import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ProductCategoryType, ProductCategoryWithSubCategoryType} from "./ProductCategoryTypes.ts"

export const productCategoryApi = createApi({
    reducerPath: "productCategoryApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["ProductCategory", "ProductCategoryWithSubCategory"],
    endpoints: (builder) => ({
        getCategories: builder.query<ProductCategoryType[], void>({
            query: () => "/product-category",
            providesTags: ["ProductCategory"]
        }),
        getCategoriesWithSubCategories: builder.query<ProductCategoryWithSubCategoryType[], void>({
            query: () => "/product-category/with-subcategories",
            providesTags: ["ProductCategory"]
        }),
        createCategory: builder.mutation<ProductCategoryType, Partial<ProductCategoryType>>({
            query: (body) => ({
                url: "/product-category",
                method: "POST",
                body
            }),
            invalidatesTags: ["ProductCategory", "ProductCategoryWithSubCategory"]
        }),
        updateCategory: builder.mutation<ProductCategoryType, {id: number; body: Partial<ProductCategoryType>}>({
            query: ({id, body}) => ({
                url: `/product-category/${id}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: ["ProductCategory", "ProductCategoryWithSubCategory"]
        }),
        deleteCategory: builder.mutation<void, number>({
            query: (id) => ({
                url: `/product-category/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ProductCategory", "ProductCategoryWithSubCategory"]
        })
    })
})

export const {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetCategoriesWithSubCategoriesQuery
} = productCategoryApi
