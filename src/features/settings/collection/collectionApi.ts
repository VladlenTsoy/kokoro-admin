import {createApi} from "@reduxjs/toolkit/query/react"
import type {CollectionType} from "./CollectionTypes.ts"
import {addFileUploaderApi} from "../../../utils/appApiConfig.ts"

export const collectionApi = createApi({
    reducerPath: "collectionApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Collection"],
    endpoints: (builder) => ({
        getCollections: builder.query<CollectionType[], void>({
            query: () => "/collections",
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((collection) => ({type: "Collection" as const, id: collection.id})),
                        {type: "Collection" as const, id: "LIST"}
                    ]
                    : [{type: "Collection" as const, id: "LIST"}]
        }),
        getCollectionById: builder.query<CollectionType, number>({
            query: (id) => `/collections/${id}`,
            providesTags: (_result, _error, id) => [{type: "Collection", id}]
        }),
        createCollection: builder.mutation<CollectionType, {title: string}>({
            query: (body) => ({
                url: "/collections",
                method: "POST",
                body
            }),
            invalidatesTags: [{type: "Collection", id: "LIST"}]
        }),
        updateCollection: builder.mutation<CollectionType, {id: number; title: string}>({
            query: ({id, title}) => ({
                url: `/collections/${id}`,
                method: "PATCH",
                body: {title}
            }),
            invalidatesTags: (_result, _error, {id}) => [
                {type: "Collection", id},
                {type: "Collection", id: "LIST"}
            ]
        }),
        deleteCollection: builder.mutation<{message: string}, number>({
            query: (id) => ({
                url: `/collections/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, id) => [
                {type: "Collection", id},
                {type: "Collection", id: "LIST"}
            ]
        })
    })
})

export const {
    useGetCollectionsQuery,
    useGetCollectionByIdQuery,
    useCreateCollectionMutation,
    useUpdateCollectionMutation,
    useDeleteCollectionMutation
} = collectionApi
