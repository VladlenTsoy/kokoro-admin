import {createApi} from "@reduxjs/toolkit/query/react"
import type {SizeType} from "./SizeTypes.ts"
import {addFileUploaderApi} from "../../../utils/appApiConfig.ts"

export const sizeApi = createApi({
    reducerPath: "sizeApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Size"],
    endpoints: (builder) => ({
        getSizes: builder.query<SizeType[], void>({
            query: () => "/size",
            providesTags: ["Size"]
        }),
        createSize: builder.mutation<void, Partial<SizeType>>({
            query: (body) => ({
                url: "/size",
                method: "POST",
                body
            }),
            invalidatesTags: ["Size"]
        }),
        updateSize: builder.mutation<void, {id: number; data: Partial<SizeType>}>({
            query: ({id, data}) => ({
                url: `/size/${id}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: (_res, _err, {id}) => [{type: "Size", id}]
        }),
        deleteSize: builder.mutation<void, number>({
            query: (id) => ({
                url: `/size/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Size"]
        })
    })
})

export const {
    useGetSizesQuery,
    useCreateSizeMutation,
    useUpdateSizeMutation,
    useDeleteSizeMutation
} = sizeApi
