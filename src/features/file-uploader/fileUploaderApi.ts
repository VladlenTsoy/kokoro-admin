import {createApi} from "@reduxjs/toolkit/query/react"
import type {DeleteFileArgs, DeleteFileResponse, FileTypes} from "./FileUploaderTypes.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

export const fileUploaderApi = createApi({
    reducerPath: "fileUploaderApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["File"],
    endpoints: builder => ({
        uploadPhoto: builder.mutation<FileTypes, FormData>({
            query: body => ({
                url: `image/upload`,
                method: "POST",
                body
            }),
            invalidatesTags: ["File"]
        }),
        deletePhoto: builder.mutation<DeleteFileResponse, DeleteFileArgs>({
            query: body => ({
                url: `image/delete`,
                method: "POST",
                body
            }),
            invalidatesTags: ["File"]
        })
    })
})

export const {useUploadPhotoMutation, useDeletePhotoMutation} = fileUploaderApi