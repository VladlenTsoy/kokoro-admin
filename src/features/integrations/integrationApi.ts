import {createApi} from "@reduxjs/toolkit/query/react"
import {baseQueryWithReauth} from "../../utils/appApiConfig.ts"
import type {IntegrationProviderKey, IntegrationSetting, UpdateIntegrationPayload} from "./integrationTypes.ts"

export const integrationApi = createApi({
    reducerPath: "integrationApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Integration"],
    endpoints: (builder) => ({
        getIntegrations: builder.query<IntegrationSetting[], void>({
            query: () => "integrations",
            providesTags: ["Integration"]
        }),
        updateIntegration: builder.mutation<IntegrationSetting, {providerKey: IntegrationProviderKey; body: UpdateIntegrationPayload}>({
            query: ({providerKey, body}) => ({
                url: `integrations/${providerKey}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: ["Integration"]
        }),
        testIntegration: builder.mutation<IntegrationSetting, IntegrationProviderKey>({
            query: (providerKey) => ({
                url: `integrations/${providerKey}/test`,
                method: "POST"
            }),
            invalidatesTags: ["Integration"]
        })
    })
})

export const {useGetIntegrationsQuery, useUpdateIntegrationMutation, useTestIntegrationMutation} = integrationApi
