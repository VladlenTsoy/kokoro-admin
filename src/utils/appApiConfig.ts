import {fetchBaseQuery} from "@reduxjs/toolkit/query/react"

export const addFileUploaderApi = fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"})