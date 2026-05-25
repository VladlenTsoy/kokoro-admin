import {Button, Tooltip} from "antd"
import {SettingOutlined} from "@ant-design/icons"
import {useLocation, useNavigate} from "react-router-dom"
import {useCanAny} from "../../features/auth/permissions.ts"

const SETTINGS_SECTION_TITLES: Record<string, string> = {
    overview: "Checklist запуска",
    "product-categories": "Категории",
    collections: "Коллекции",
    sizes: "Размеры",
    colors: "Цвета",
    "product-tags": "Теги",
    "product-variant-statuses": "Статусы SKU",
    "product-properties": "Свойства товара",
    countries: "Страны и города",
    "sales-points": "Точки продаж",
    "product-storages": "Склады",
    sources: "Источник заказа",
    "promo-codes": "Промокоды",
    "order-statuses": "Статусы заказов",
    notifications: "Уведомления",
    payments: "Платежи",
    integrations: "Интеграции",
    employees: "Сотрудники",
    roles: "Роли"
}

const HeaderSettingsButton = () => {
    const navigate = useNavigate()
    const {pathname} = useLocation()
    const isSettingsPage = pathname.startsWith("/settings")
    const currentSettingsSection = pathname.split("/")[2]
    const currentSettingsTitle = currentSettingsSection
        ? `Текущий раздел настроек: ${SETTINGS_SECTION_TITLES[currentSettingsSection] ?? currentSettingsSection}`
        : "Текущий раздел настроек"
    const settingsButtonLabel = isSettingsPage ? currentSettingsTitle : "Открыть настройки админки"
    const canOpenSettings = useCanAny(["settings.read", "catalog.read", "marketing.read", "integrations.read", "staff.read"])

    if (!canOpenSettings) {
        return null
    }

    return (
        <Tooltip title={settingsButtonLabel}>
            <Button
                aria-label={settingsButtonLabel}
                size="large"
                shape="circle"
                type={isSettingsPage ? "primary" : "default"}
                title={settingsButtonLabel}
                icon={<SettingOutlined />}
                onClick={() => navigate("/settings")}
            />
        </Tooltip>
    )
}

export default HeaderSettingsButton
