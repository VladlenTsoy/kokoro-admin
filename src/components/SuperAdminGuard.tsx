import {Navigate, Outlet} from "react-router-dom"
import {Spin} from "antd"
import {useIsSuperAdmin, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useGetMeQuery} from "../features/admin/authApi.ts"

const SuperAdminGuard = () => {
    const {accessToken, employee} = useSelectedAuthData()
    const isSuperAdmin = useIsSuperAdmin()

    const {isLoading} = useGetMeQuery(undefined, {
        skip: !accessToken || Boolean(employee)
    })

    if (!accessToken) {
        return <Navigate to="/login" replace />
    }

    if (!employee && isLoading) {
        return <Spin fullscreen />
    }

    if (!isSuperAdmin) {
        return <Navigate to="/forbidden" replace />
    }

    return <Outlet />
}

export default SuperAdminGuard
