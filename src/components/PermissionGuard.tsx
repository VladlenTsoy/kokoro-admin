import {Navigate, Outlet, useLocation} from "react-router-dom"
import {Spin} from "antd"
import {setEmployee, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useGetMeQuery} from "../features/admin/authApi.ts"
import {can, canAny} from "../features/auth/permissions.ts"
import {useDispatch} from "../features/store.ts"
import {useEffect} from "react"
import type {PermissionCode} from "../features/auth/authTypes.ts"

const PERMISSION_MODULE_LABELS: Record<string, string> = {
    catalog: "каталог",
    clients: "клиентов",
    dashboard: "дашборд",
    integrations: "интеграции",
    marketing: "маркетинг",
    orders: "заказы",
    settings: "настройки",
    staff: "сотрудников и роли"
}

const PERMISSION_ACTION_LABELS: Record<string, string> = {
    create: "создание",
    delete: "удаление",
    manage: "полное управление",
    read: "просмотр",
    update: "редактирование"
}

const getPermissionLabel = (permissionCode: PermissionCode) => {
    const [module, action] = permissionCode.split(".")
    const moduleLabel = module ? PERMISSION_MODULE_LABELS[module] : undefined
    const actionLabel = action ? PERMISSION_ACTION_LABELS[action] : undefined

    if (moduleLabel && actionLabel) {
        return `${actionLabel}: ${moduleLabel}`
    }

    return moduleLabel ?? "нужный раздел"
}

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
        return <Navigate to="/login" replace />
    }

    if ((!currentEmployee || !Array.isArray(currentEmployee.permissions)) && isLoading) {
        return <Spin fullscreen />
    }

    const missingPermissionLabel = permission && !can(currentEmployee?.permissions, permission)
        ? getPermissionLabel(permission)
        : anyOf && !canAny(currentEmployee?.permissions, anyOf)
            ? anyOf.map(getPermissionLabel).join(" или ")
            : undefined

    if (missingPermissionLabel) {
        return (
            <Navigate
                to="/forbidden"
                replace
                state={{from: location.pathname, permissionLabel: missingPermissionLabel}}
            />
        )
    }

    return <Outlet />
}

export default PermissionGuard
