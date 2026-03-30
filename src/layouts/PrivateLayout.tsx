import {Navigate, Outlet} from "react-router-dom"
import {setEmployee, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useGetMeQuery} from "../features/admin/authApi.ts"
import {useDispatch} from "../features/store.ts"
import {useEffect} from "react"
import {Spin} from "antd"

const PrivateLayout = () => {
    const dispatch = useDispatch()
    const {accessToken, employee} = useSelectedAuthData()
    const {data, isLoading} = useGetMeQuery(undefined, {
        skip: !accessToken || Boolean(employee)
    })

    useEffect(() => {
        if (data) {
            dispatch(setEmployee(data))
        }
    }, [data, dispatch])

    if (!accessToken) {
        return <Navigate to="/login" replace />
    }

    if (!employee && isLoading) {
        return <Spin fullscreen />
    }

    return <Outlet />
}

export default PrivateLayout
