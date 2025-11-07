import {Navigate, Outlet} from "react-router-dom"
import {useSelectedAuthData} from "../features/auth/authSlice.ts"

const PrivateLayout = () => {
    const {token} = useSelectedAuthData()

    if (!token) {
        return <Navigate to="/login" replace />
    }

    // Если авторизован — показываем вложенные маршруты
    return <Outlet />
}

export default PrivateLayout
