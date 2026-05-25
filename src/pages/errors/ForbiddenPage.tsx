import {Alert, Button, Card, Result, Space, Tag, Typography} from "antd"
import {useLocation, useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"
import type {PermissionCode} from "../../features/auth/authTypes.ts"

const {Text} = Typography

const getEmployeeDisplayName = (employee: ReturnType<typeof useSelectedAuthData>["employee"]) => {
    if (!employee) {
        return "Пользователь не определён"
    }

    const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim()

    return fullName || employee.email
}

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
    const accessRequestText = `Нужен доступ: ${permissionText}. Раздел: ${requestedPath}. Сотрудник: ${getEmployeeDisplayName(employee)}.`

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <Result
                status="403"
                title="Нет доступа к разделу"
                subTitle={
                    <Space direction="vertical" size={4}>
                        <Text>Для перехода в {requestedPath} нужны права на {permissionText}.</Text>
                        <Text type="secondary">
                            Если это рабочий сценарий менеджера, не обходите ограничение — передайте запрос администратору и дождитесь подтверждения роли.
                        </Text>
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

            <Card title="Что делать дальше">
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        showIcon
                        type="warning"
                        message="Доступ не выдан для текущей роли"
                        description="Скопируйте готовый запрос ниже. Это поможет администратору быстро понять, какой раздел и какое право нужны без скриншотов и ручного пересказа."
                    />

                    <Space wrap align="center">
                        <Tag color="blue">Раздел: {requestedPath}</Tag>
                        <Tag color="orange">Право: {permissionText}</Tag>
                        <Tag color="default">Сотрудник: {getEmployeeDisplayName(employee)}</Tag>
                    </Space>

                    <Text copyable={{text: accessRequestText}}>
                        Запрос администратору: {accessRequestText}
                    </Text>

                    {canManageStaffAccess ? (
                        <Alert
                            showIcon
                            type="info"
                            message="У вас есть доступ к справочнику сотрудников"
                            description="Можно сразу открыть сотрудников и проверить роль, но любые изменения доступов должны соответствовать процессу команды."
                        />
                    ) : (
                        <Alert
                            showIcon
                            type="info"
                            message="Кто может помочь"
                            description="Обратитесь к администратору магазина или ответственному за роли сотрудников."
                        />
                    )}
                </Space>
            </Card>
        </Space>
    )
}

export default ForbiddenPage
