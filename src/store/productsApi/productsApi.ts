import {createApi} from '@reduxjs/toolkit/query/react'
import { SelectProductsFilterParams } from '../../types/Product'
import baseQuery from '../apiConfig'

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery,
    endpoints: build => ({
         getAllProducts: build.query<any, SelectProductsFilterParams>({
            query: (body: any) => ({
                url: `user/admin/product-colors/table`,
                method: "POST",
                body
            }),
        }),
    })
})

export const {useGetAllProductsQuery} = productsApi