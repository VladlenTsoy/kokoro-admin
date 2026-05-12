import {Navigate, Outlet, useLocation} from "react-router-dom"
import {Spin} from "antd"
import {setEmployee, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useGetMeQuery} from "../features/admin/authApi.ts"
import {can, canAny} from "../features/auth/permissions.ts"
import {useDispatch} from "../features/store.ts"
import {useEffect} from "react"
import type {PermissionCode} from "../features/auth/authTypes.ts"

interface PermissionGuardProps {
    permission?: PermissionCode
    anyOf?: PermissionCode[]
}

const PermissionGuard = ({permission, anyOf}: PermissionGuardProps) => {
    const dispatch = useDispatch()
    const location = useLocation()
    const {accessToken, employee} = useSelectedAuthData()
    const hasPermissionSnapshot = Array.isArray(employee?.permissions)
    const {data, isLoading} = useGetMeQuery(undefined, {
        skip: !accessToken || hasPermissionSnapshot
    })

    useEffect(() => {
        if (data) {
            dispatch(setEmployee(data))
        }
    }, [data, dispatch])

    const currentEmployee = employee ?? data

    if (!accessToken) {
        return (
            <Navigate
                to="/login"
                replace
                state={{returnTo: `${location.pathname}${location.search}${location.hash}`}}
            />
        )
    }

    if ((!currentEmployee || !Array.isArray(currentEmployee.permissions)) && isLoading) {
        return <Spin fullscreen />
    }

    if (
        (permission && !can(currentEmployee?.permissions, permission)) ||
        (anyOf && !canAny(currentEmployee?.permissions, anyOf))
    ) {
        return (
            <Navigate
                to="/forbidden"
                replace
                state={{from: location.pathname + location.search, permission, anyOf}}
            />
        )
    }

    return <Outlet />
}

export default PermissionGuard
