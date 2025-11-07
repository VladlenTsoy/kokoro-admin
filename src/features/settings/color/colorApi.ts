import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {ColorType} from "./ColorTypes.ts"

export const colorApi = createApi({
    reducerPath: "colorApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["Color"],
    endpoints: (builder) => ({
        getColors: builder.query<ColorType[], void>({
            query: () => "/color",
            providesTags: ["Color"]
        }),
        getColor: builder.query<ColorType, number>({
            query: (id) => `/color/${id}`,
            providesTags: (_res, _err, id) => [{type: "Color", id}]
        }),
        createColor: builder.mutation<void, Partial<ColorType>>({
            query: (body) => ({
                url: "/color",
                method: "POST",
                body
            }),
            invalidatesTags: ["Color"]
        }),
        updateColor: builder.mutation<void, {id: number; data: Partial<ColorType>}>({
            query: ({id, data}) => ({
                url: `/color/${id}`,
                method: "PUT",
                body: data
            }),
            invalidatesTags: (_res, _err, {id}) => [{type: "Color", id}]
        }),
        deleteColor: builder.mutation<void, number>({
            query: (id) => ({
                url: `/color/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Color"]
        })
    })
})

export const {
    useGetColorsQuery,
    useGetColorQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation
} = colorApi
