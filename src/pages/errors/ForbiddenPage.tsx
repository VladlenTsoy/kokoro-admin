import {Button, Result, Space, Typography} from "antd"
import {useLocation, useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"
import type {PermissionCode} from "../../features/auth/authTypes.ts"

const {Text} = Typography

const PERMISSION_LABELS: Record<string, string> = {
    "dashboard.read": "просмотр дашборда",
    "orders.read": "просмотр заказов",
    "catalog.read": "просмотр каталога",
    "catalog.create": "создание товаров",
    "catalog.update": "редактирование товаров",
    "clients.read": "просмотр клиентов",
    "settings.read": "просмотр настроек",
    "marketing.read": "просмотр маркетинга",
    "integrations.read": "просмотр интеграций",
    "staff.read": "просмотр сотрудников и ролей"
}

interface ForbiddenLocationState {
    from?: string
    permission?: PermissionCode
    anyOf?: PermissionCode[]
}

const getPermissionText = (state: ForbiddenLocationState) => {
    if (state.permission) {
        return PERMISSION_LABELS[state.permission] ?? state.permission
    }

    if (state.anyOf?.length) {
        return state.anyOf.map((permission) => PERMISSION_LABELS[permission] ?? permission).join(" или ")
    }

    return "нужный раздел админки"
}

const ForbiddenPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = (location.state ?? {}) as ForbiddenLocationState
    const {employee} = useSelectedAuthData()
    const requestedPath = state.from ?? "запрошенный раздел"
    const permissionText = getPermissionText(state)
    const canManageStaffAccess = can(employee?.permissions, "staff.read")
    const accessRequestText = `Нужен доступ: ${permissionText}. Раздел: ${requestedPath}.`

    return (
        <Result
            status="403"
            title="Нет доступа к разделу"
            subTitle={
                <Space direction="vertical" size={4}>
                    <Text>Для перехода в {requestedPath} нужны права на {permissionText}.</Text>
                    <Text type="secondary">
                        Если это рабочий сценарий менеджера, попросите администратора проверить роль и выдать доступ.
                    </Text>
                    {!canManageStaffAccess && (
                        <Text type="secondary" copyable={{text: accessRequestText}}>
                            Скопируйте запрос администратору: {accessRequestText}
                        </Text>
                    )}
                </Space>
            }
            extra={
                <Space wrap>
                    <Button type="primary" onClick={() => navigate("/")}>На дашборд</Button>
                    <Button onClick={() => navigate(-1)}>Вернуться назад</Button>
                    {canManageStaffAccess && (
                        <Button onClick={() => navigate("/settings/employees")}>Проверить доступы</Button>
                    )}
                </Space>
            }
        />
    )
}

export default ForbiddenPage
