import type {MenuProps} from "antd"
import {Alert, Button, Card, Empty, Input, Menu, Space, Tag, Typography} from "antd"
import {createStyles} from "antd-style"
import {Outlet, useLocation, useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../features/auth/authSlice.ts"
import {useMemo, useState} from "react"
import {SearchOutlined} from "@ant-design/icons"
import PageHeading from "../components/PageHeading.tsx"
import {can} from "../features/auth/permissions.ts"
import type {PermissionCode} from "../features/auth/authTypes.ts"

interface SettingsMenuChild {
    key: string
    label: string
    permission: PermissionCode
}

interface SettingsMenuGroup {
    key: string
    label: string
    children: SettingsMenuChild[]
}

const BASE_SETTINGS_GROUPS: SettingsMenuGroup[] = [
    {
        key: "launch",
        label: "Запуск",
        children: [{key: "overview", label: "Checklist запуска", permission: "settings.read"}]
    },
    {
        key: "product",
        label: "Продукт",
        children: [
            {key: "product-categories", label: "Категории", permission: "catalog.read"},
            {key: "collections", label: "Коллекции", permission: "catalog.read"},
            {key: "sizes", label: "Размеры", permission: "catalog.read"},
            {key: "colors", label: "Цвета", permission: "catalog.read"},
            {key: "product-tags", label: "Теги", permission: "catalog.read"},
            {key: "product-variant-statuses", label: "Статусы", permission: "catalog.read"},
            {key: "product-properties", label: "Свойства", permission: "catalog.read"}
        ]
    },
    {
        key: "delivery",
        label: "Доставка",
        children: [{key: "countries", label: "Страны и города", permission: "settings.read"}]
    },
    {
        key: "branch",
        label: "Филиал",
        children: [
            {key: "sales-points", label: "Точки продаж", permission: "settings.read"},
            {key: "product-storages", label: "Склады", permission: "settings.read"}
        ]
    },
    {
        key: "order",
        label: "Заказ",
        children: [{key: "sources", label: "Источник", permission: "settings.read"}]
    },
    {
        key: "ops",
        label: "Операции",
        children: [
            {key: "promo-codes", label: "Промокоды", permission: "marketing.read"},
            {key: "order-statuses", label: "Статусы заказов", permission: "settings.read"},
            {key: "notifications", label: "Уведомления", permission: "settings.read"},
            {key: "payments", label: "Платежи", permission: "settings.read"}
        ]
    },
    {
        key: "growth",
        label: "Рост",
        children: [{key: "integrations", label: "Интеграции", permission: "integrations.read"}]
    },
    {
        key: "admin",
        label: "Администрирование",
        children: [
            {key: "employees", label: "Сотрудники", permission: "staff.read"},
            {key: "roles", label: "Роли", permission: "staff.read"}
        ]
    }
]

const useStyles = createStyles(({token}) => ({
    wrapper: {
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16,
        "@media (max-width: 980px)": {
            gridTemplateColumns: "1fr"
        }
    },
    menuCard: {
        position: "sticky",
        top: 118,
        borderRadius: token.borderRadiusLG + 8,
        alignSelf: "start",
        borderColor: "rgba(54, 58, 66, 0.08)",
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.055)",
        "@media (max-width: 980px)": {
            position: "static"
        }
    },
    contentCard: {
        borderRadius: token.borderRadiusLG + 8,
        borderColor: "rgba(54, 58, 66, 0.08)",
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.055)"
    },
    menu: {
        borderInlineEnd: 0,
        background: "transparent",
        "& .ant-menu-item": {
            borderRadius: token.borderRadiusLG
        },
        "& .ant-menu-item-selected": {
            fontWeight: 700
        }
    },
    menuHeader: {
        marginBottom: 10
    },
    menuSearch: {
        marginTop: 6
    },
    summary: {
        marginBottom: 12
    },
    emptyState: {
        padding: "16px 0"
    },
    noAccessAlert: {
        marginTop: 12
    }
}))

const SettingsLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const {styles} = useStyles()
    const {employee} = useSelectedAuthData()
    const [query, setQuery] = useState("")

    const groups = useMemo<SettingsMenuGroup[]>(() => {
        return BASE_SETTINGS_GROUPS
            .map((group) => ({
                ...group,
                children: group.children.filter((child) => can(employee?.permissions, child.permission))
            }))
            .filter((group) => group.children.length > 0)
    }, [employee?.permissions])

    const filteredGroups = useMemo<SettingsMenuGroup[]>(() => {
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) {
            return groups
        }

        return groups
            .map((group) => ({
                ...group,
                children: group.children.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
            }))
            .filter((group) => group.children.length > 0)
    }, [groups, query])

    const items = useMemo<MenuProps["items"]>(() => {
        return filteredGroups.map((group) => ({
            key: group.key,
            label: group.label,
            type: "group",
            children: group.children.map((child) => ({
                key: child.key,
                label: child.label
            }))
        }))
    }, [filteredGroups])

    const allChildrenCount = groups.reduce((acc, group) => acc + group.children.length, 0)
    const filteredChildrenCount = filteredGroups.reduce((acc, group) => acc + group.children.length, 0)
    const hasSettingsAccess = allChildrenCount > 0
    const hasSearchResults = filteredChildrenCount > 0

    // Определяем текущий активный ключ из pathname
    const selectedKey = location.pathname.split("/")[2]

    const onClickHandler: MenuProps["onClick"] = (e) => {
        navigate(`/settings/${e.key}`)
    }

    const clearSearch = () => setQuery("")

    return (
        <div>
            <PageHeading
                size="compact"
                eyebrow="Launch control"
                title="Настройки"
                subtitle="Конфигурация справочников, статусов и служебных сущностей в одном запусковом контуре."
                extra={<Tag color="blue">Разделов: {allChildrenCount}</Tag>}
            />
            <div className={styles.wrapper}>
                <Card className={styles.menuCard}>
                    <div className={styles.menuHeader}>
                        <Space className={styles.summary}>
                            <Typography.Text strong>Быстрый переход</Typography.Text>
                        </Space>
                        <Input
                            className={styles.menuSearch}
                            placeholder="Поиск по настройкам"
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            allowClear
                        />
                    </div>
                    {!hasSettingsAccess && (
                        <Alert
                            className={styles.noAccessAlert}
                            type="warning"
                            showIcon
                            message="Нет доступных разделов настроек"
                            description="Попросите администратора проверить роли и права доступа к настройкам магазина."
                        />
                    )}
                    {hasSettingsAccess && !hasSearchResults && (
                        <Empty
                            className={styles.emptyState}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={(
                                <Space direction="vertical" size={8}>
                                    <Typography.Text>По запросу «{query.trim()}» ничего не найдено.</Typography.Text>
                                    <Typography.Text type="secondary">
                                        Попробуйте название справочника, например «Платежи», «Склады» или «Роли».
                                    </Typography.Text>
                                    <Button type="link" onClick={clearSearch}>Сбросить поиск</Button>
                                </Space>
                            )}
                        />
                    )}
                    {hasSettingsAccess && hasSearchResults && (
                        <Menu
                            className={styles.menu}
                            onClick={onClickHandler}
                            mode="inline"
                            items={items}
                            selectedKeys={[selectedKey]}
                        />
                    )}
                </Card>
                <Card className={styles.contentCard}>
                    <Outlet />
                </Card>
            </div>
        </div>
    )
}

export default SettingsLayout
