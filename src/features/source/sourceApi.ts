import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {SourceType} from "./SourceType.ts"

export const sourceApi = createApi({
    reducerPath: "sourceApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api"}),
    tagTypes: ["Source"],
    endpoints: (builder) => ({
        getSources: builder.query<SourceType[], void>({
            query: () => "/sources",
            providesTags: ["Source"]
        }),
        createSource: builder.mutation<SourceType, Partial<SourceType>>({
            query: (body) => ({
                url: "/sources",
                method: "POST",
                body
            }),
            invalidatesTags: ["Source"]
        }),
        updateSource: builder.mutation<SourceType, {id: number; body: Partial<SourceType>}>({
            query: ({id, body}) => ({
                url: `/sources/${id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: ["Source"]
        }),
        deleteSource: builder.mutation<void, number>({
            query: (id) => ({
                url: `/sources/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Source"]
        })
    })
})

export const {
    useGetSourcesQuery,
    useCreateSourceMutation,
    useUpdateSourceMutation,
    useDeleteSourceMutation
} = sourceApi