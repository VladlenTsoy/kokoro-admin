import {createApi} from "@reduxjs/toolkit/query/react"
import type {PermissionCatalogModule, PermissionCode, Role} from "../auth/authTypes.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

interface CreateRoleRequest {
    code: string
    name: string
    isActive: boolean
    permissions: PermissionCode[]
}

interface UpdateRoleRequest {
    id: number
    code?: string
    name?: string
    isActive?: boolean
    permissions?: PermissionCode[]
}

export const roleApi = createApi({
    reducerPath: "roleApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Role", "PermissionCatalog"],
    endpoints: (builder) => ({
        getRolePermissions: builder.query<PermissionCatalogModule[], void>({
            query: () => "roles/permissions",
            providesTags: [{type: "PermissionCatalog", id: "LIST"}]
        }),
        getRoles: builder.query<Role[], void>({
            query: () => "roles",
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((role) => ({type: "Role" as const, id: role.id})),
                        {type: "Role" as const, id: "LIST"}
                    ]
                    : [{type: "Role" as const, id: "LIST"}]
        }),
        getRoleById: builder.query<Role, number>({
            query: (id) => `roles/${id}`,
            providesTags: (_result, _error, id) => [{type: "Role", id}]
        }),
        createRole: builder.mutation<Role, CreateRoleRequest>({
            query: (body) => ({
                url: "roles",
                method: "POST",
                body: {
                    ...body,
                    code: body.code.toUpperCase()
                }
            }),
            invalidatesTags: [{type: "Role", id: "LIST"}]
        }),
        updateRole: builder.mutation<Role, UpdateRoleRequest>({
            query: ({id, ...body}) => ({
                url: `roles/${id}`,
                method: "PATCH",
                body: body.code ? {...body, code: body.code.toUpperCase()} : body
            }),
            invalidatesTags: (_result, _error, {id}) => [{type: "Role", id}, {type: "Role", id: "LIST"}]
        }),
        deleteRole: builder.mutation<{message: string}, number>({
            query: (id) => ({
                url: `roles/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, id) => [{type: "Role", id}, {type: "Role", id: "LIST"}]
        })
    })
})

export const {
    useGetRolePermissionsQuery,
    useGetRolesQuery,
    useGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation
} = roleApi
