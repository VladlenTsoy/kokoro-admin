import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import type {CountryType, CityType} from "./CountryTypes.ts"

export const countriesApi = createApi({
    reducerPath: "countriesApi",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/admin"}),
    tagTypes: ["Country", "City"],
    endpoints: (builder) => ({
        // === Countries ===
        getCountries: builder.query<CountryType[], void>({
            query: () => "countries",
            // помечаем каждый country и общий LIST, чтобы можно было инвалидацию точечно и список
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((c) => ({type: "Country" as const, id: c.id})),
                        {type: "Country" as const, id: "LIST"}
                    ]
                    : [{type: "Country" as const, id: "LIST"}]
        }),

        getCountry: builder.query<CountryType, number>({
            query: (id) => `countries/${id}`,
            providesTags: (result, error, id) => [
                {type: "Country" as const, id},
                {type: "Country" as const, id: "LIST"}
            ]
        }),

        createCountry: builder.mutation<CountryType, Omit<CountryType, "id" | "cities">>({
            query: (body) => ({
                url: "countries",
                method: "POST",
                body
            }),
            // после создания нужно обновить список
            invalidatesTags: [{type: "Country", id: "LIST"}]
        }),

        updateCountry: builder.mutation<CountryType, Partial<CountryType> & {id: number}>({
            query: ({id, ...patch}) => ({
                url: `countries/${id}`,
                method: "PUT", // или PATCH если на сервере так принято
                body: patch
            }),
            invalidatesTags: (result, error, arg) => [
                {type: "Country", id: arg.id},
                {type: "Country", id: "LIST"}
            ]
        }),

        deleteCountry: builder.mutation<{success: boolean; id: number}, number>({
            query: (id) => ({
                url: `countries/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (result, error, id) => [
                {type: "Country", id},
                {type: "Country", id: "LIST"}
            ]
        }),

        // === Cities ===
        createCity: builder.mutation<CityType, {countryId: number; city: Omit<CityType, "id">}>({
            query: ({countryId, city}) => ({
                url: `countries/${countryId}/cities`,
                method: "POST",
                body: city
            }),
            // инвалидация самой страны (чтобы обновить список городов), можно добавить City tag если нужно
            invalidatesTags: (result, error, {countryId}) => [{type: "Country", id: countryId}]
        }),

        updateCity: builder.mutation<
            CityType,
            {countryId: number; cityId: number; data: Partial<CityType>}
        >({
            query: ({countryId, cityId, data}) => ({
                url: `countries/${countryId}/cities/${cityId}`,
                method: "PUT", // или PATCH
                body: data
            }),
            invalidatesTags: (result, error, {countryId, cityId}) => [
                {type: "Country", id: countryId},
                {type: "City", id: cityId}
            ]
        }),

        deleteCity: builder.mutation<
            {success: boolean; cityId: number},
            {countryId: number; cityId: number}
        >({
            query: ({countryId, cityId}) => ({
                url: `countries/${countryId}/cities/${cityId}`,
                method: "DELETE"
            }),
            invalidatesTags: (result, error, {countryId, cityId}) => [
                {type: "Country", id: countryId},
                {type: "City", id: cityId}
            ]
        })
    })
})

// Экспорт хуков
export const {
    useGetCountriesQuery,
    useGetCountryQuery,
    useCreateCountryMutation,
    useUpdateCountryMutation,
    useDeleteCountryMutation,
    useCreateCityMutation,
    useUpdateCityMutation,
    useDeleteCityMutation
} = countriesApi
