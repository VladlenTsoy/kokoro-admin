import {createApi} from "@reduxjs/toolkit/query/react"
import type {EmployeeSafe} from "../auth/authTypes.ts"
import {addFileUploaderApi} from "../../utils/appApiConfig.ts"

interface CreateEmployeeRequest {
    email: string
    firstName: string
    lastName: string
    phone: string
    password: string
    roleIds: number[]
    isActive: boolean
}

interface UpdateEmployeeRequest {
    id: number
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
    password?: string
    roleIds?: number[]
    isActive?: boolean
}

interface UpdateEmployeeRolesRequest {
    id: number
    roleIds: number[]
}

export const employeeApi = createApi({
    reducerPath: "employeeApi",
    baseQuery: addFileUploaderApi,
    tagTypes: ["Employee"],
    endpoints: (builder) => ({
        getEmployees: builder.query<EmployeeSafe[], void>({
            query: () => "employees",
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((employee) => ({type: "Employee" as const, id: employee.id})),
                        {type: "Employee" as const, id: "LIST"}
                    ]
                    : [{type: "Employee" as const, id: "LIST"}]
        }),
        getEmployeeById: builder.query<EmployeeSafe, number>({
            query: (id) => `employees/${id}`,
            providesTags: (_result, _error, id) => [{type: "Employee", id}]
        }),
        createEmployee: builder.mutation<EmployeeSafe, CreateEmployeeRequest>({
            query: (body) => ({
                url: "employees",
                method: "POST",
                body
            }),
            invalidatesTags: [{type: "Employee", id: "LIST"}]
        }),
        updateEmployee: builder.mutation<EmployeeSafe, UpdateEmployeeRequest>({
            query: ({id, ...body}) => ({
                url: `employees/${id}`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (_result, _error, {id}) => [
                {type: "Employee", id},
                {type: "Employee", id: "LIST"}
            ]
        }),
        updateEmployeeRoles: builder.mutation<EmployeeSafe, UpdateEmployeeRolesRequest>({
            query: ({id, roleIds}) => ({
                url: `employees/${id}/roles`,
                method: "PATCH",
                body: {roleIds}
            }),
            invalidatesTags: (_result, _error, {id}) => [
                {type: "Employee", id},
                {type: "Employee", id: "LIST"}
            ]
        }),
        deleteEmployee: builder.mutation<{message: string}, number>({
            query: (id) => ({
                url: `employees/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, id) => [
                {type: "Employee", id},
                {type: "Employee", id: "LIST"}
            ]
        })
    })
})

export const {
    useGetEmployeesQuery,
    useGetEmployeeByIdQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useUpdateEmployeeRolesMutation,
    useDeleteEmployeeMutation
} = employeeApi
