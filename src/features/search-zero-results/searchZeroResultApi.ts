import {createApi} from "@reduxjs/toolkit/query/react"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export interface SearchZeroResultItem {
    id: number
    query: string
    count: number
    lastSearchedAt: string
    createdAt: string
    updatedAt: string
}

export const searchZeroResultApi = createApi({
    reducerPath: "searchZeroResultApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["SearchZeroResult"],
    endpoints: (builder) => ({
        getSearchZeroResults: builder.query<SearchZeroResultItem[], void>({
            query: () => ({url: "/search-zero-results"}),
            providesTags: ["SearchZeroResult"]
        })
    })
})

export const {useGetSearchZeroResultsQuery} = searchZeroResultApi
