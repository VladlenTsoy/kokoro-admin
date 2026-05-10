import {Navigate, Outlet, useLocation} from "react-router-dom"
import {setEmployee, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useGetMeQuery} from "../features/admin/authApi.ts"
import {useDispatch} from "../features/store.ts"
import {useEffect} from "react"
import {Spin} from "antd"

const PrivateLayout = () => {
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

    if (!accessToken) {
        return <Navigate to="/login" replace state={{returnTo: `${location.pathname}${location.search}${location.hash}`}} />
    }

    if ((!employee || !hasPermissionSnapshot) && isLoading) {
        return <Spin fullscreen />
    }

    return <Outlet />
}

export default PrivateLayout
