import {createApi} from '@reduxjs/toolkit/query/react'
import { SelectProductsFilterParams } from '../../types/Product'
import baseQuery from '../../utils/apiConfig'

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery,
    tagTypes: ["product"],
    endpoints: build => ({
         getAllProducts: build.mutation<any, SelectProductsFilterParams>({
            query: (body: any) => ({
                url: `user/admin/product-colors/table`,
                method: "POST",
                body
            }),
            invalidatesTags: ["product"]
        }),
    })
})

export const {useGetAllProductsMutation} = productsApi