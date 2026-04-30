import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"
import type {PromoCode} from "./promoTypes.ts"

export const promoApi = createApi({
    reducerPath: "promoApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["PromoCode"],
    endpoints: (builder) => ({
        getPromoCodes: builder.query<PromoCode[], void>({
            query: () => ({url: "/promo-codes"}),
            providesTags: (result) =>
                result
                    ? [...result.map((promo) => ({type: "PromoCode" as const, id: promo.id})), {type: "PromoCode" as const, id: "LIST"}]
                    : [{type: "PromoCode" as const, id: "LIST"}]
        }),
        createPromoCode: builder.mutation<PromoCode, Partial<PromoCode>>({
            query: (body) => ({url: "/promo-codes", method: "POST", body}),
            invalidatesTags: [{type: "PromoCode", id: "LIST"}]
        }),
        updatePromoCode: builder.mutation<PromoCode, {id: number; body: Partial<PromoCode>}>({
            query: ({id, body}) => ({url: `/promo-codes/${id}`, method: "PATCH", body}),
            invalidatesTags: (_result, _error, {id}) => [{type: "PromoCode", id}, {type: "PromoCode", id: "LIST"}]
        }),
        deletePromoCode: builder.mutation<{message: string}, number>({
            query: (id) => ({url: `/promo-codes/${id}`, method: "DELETE"}),
            invalidatesTags: (_result, _error, id) => [{type: "PromoCode", id}, {type: "PromoCode", id: "LIST"}]
        })
    })
})

export const {
    useGetPromoCodesQuery,
    useCreatePromoCodeMutation,
    useUpdatePromoCodeMutation,
    useDeletePromoCodeMutation
} = promoApi
