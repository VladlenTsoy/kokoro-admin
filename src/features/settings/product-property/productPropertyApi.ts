import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ProductPropertyType} from "./ProductPropertyTypes.ts"

export const productPropertyApi = createApi({
    reducerPath: "productPropertyApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["ProductProperty"],
    endpoints: (builder) => ({
        getProductProperties: builder.query<ProductPropertyType[], {isGlobal: number}>({
            query: (data) => `/product-property?is_global=${data.isGlobal}`,
            providesTags: ["ProductProperty"]
        }),
        getProductProperty: builder.query<ProductPropertyType, number>({
            query: (id) => `/color/${id}`,
            providesTags: (_res, _err, id) => [{type: "ProductProperty", id}]
        }),
        createProductProperty: builder.mutation<void, Partial<ProductPropertyType>>({
            query: (body) => ({
                url: "/product-property",
                method: "POST",
                body
            }),
            invalidatesTags: ["ProductProperty"]
        }),
        updateProductProperty: builder.mutation<void, {id: number; data: Partial<ProductPropertyType>}>({
            query: ({id, data}) => ({
                url: `/product-property/${id}`,
                method: "PUT",
                body: data
            }),
            invalidatesTags: (_res, _err, {id}) => [{type: "ProductProperty", id}]
        }),
        deleteProductProperty: builder.mutation<void, number>({
            query: (id) => ({
                url: `/product-property/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ProductProperty"]
        })
    })
})

export const {
    useGetProductPropertiesQuery,
    useGetProductPropertyQuery,
    useCreateProductPropertyMutation,
    useUpdateProductPropertyMutation,
    useDeleteProductPropertyMutation
} = productPropertyApi