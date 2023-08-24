import {fetchBaseQuery} from "@reduxjs/toolkit/query/react"

export default fetchBaseQuery({
    baseUrl: 'https://devapi.insidebysana.uz/api/',
    prepareHeaders: (headers) => {
        try {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MTIzODYyM2E4NjQwODRjYjkwZDNlN2NkZWY1ZmFkZSIsImlhdCI6MTY5Mjg0MTEwMn0.MiWlvPXPi_B-cuQcNYfM5xkCnAxEbnd_ZwzHth__fso'
            const userToken = '71238623a864084cb90d3e7cdef5fade'

            if (token) headers.set("Authorization", `Bearer ${token}`)
            else if (userToken) headers.set("Authorization", `Bearer ${userToken}`)
        } catch (e) {
            console.error(e)
        }
        return headers
    }
})
