import {createApi} from "@reduxjs/toolkit/query/react"
import type {CountryType, CityType} from "./CountryTypes.ts"
import {addFileUploaderApi} from "../../../utils/appApiConfig.ts"

export const countriesApi = createApi({
    reducerPath: "countriesApi",
    baseQuery: addFileUploaderApi,
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
            providesTags: (_result, _error, id) => [
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
                method: "PATCH",
                body: patch
            }),
            invalidatesTags: (_result, _error, arg) => [
                {type: "Country", id: arg.id},
                {type: "Country", id: "LIST"}
            ]
        }),

        deleteCountry: builder.mutation<{success: boolean; id: number}, number>({
            query: (id) => ({
                url: `countries/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, id) => [
                {type: "Country", id},
                {type: "Country", id: "LIST"}
            ]
        }),

        // === Cities ===
        createCity: builder.mutation<CityType, {countryId: number; city: Omit<CityType, "id">}>({
            query: ({countryId, city}) => ({
                url: "cities",
                method: "POST",
                body: {...city, countryId}
            }),
            // инвалидация самой страны (чтобы обновить список городов), можно добавить City tag если нужно
            invalidatesTags: (_result, _error, {countryId}) => [{type: "Country", id: countryId}]
        }),

        updateCity: builder.mutation<
            CityType,
            {countryId: number; cityId: number; data: Partial<CityType>}
        >({
            query: ({cityId, data}) => ({
                url: `cities/${cityId}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: (_result, _error, {countryId, cityId}) => [
                {type: "Country", id: countryId},
                {type: "City", id: cityId}
            ]
        }),

        deleteCity: builder.mutation<
            {success: boolean; cityId: number},
            {countryId: number; cityId: number}
        >({
            query: ({cityId}) => ({
                url: `cities/${cityId}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, {countryId, cityId}) => [
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
