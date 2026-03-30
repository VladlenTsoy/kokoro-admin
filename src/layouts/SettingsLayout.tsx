import type {MenuProps} from "antd"
import {Card, Input, Menu, Space, Tag, Typography} from "antd"
import {createStyles} from "antd-style"
import {Outlet, useLocation, useNavigate} from "react-router-dom"
import {useIsSuperAdmin} from "../features/auth/authSlice.ts"
import {useMemo, useState} from "react"
import {SearchOutlined} from "@ant-design/icons"

interface SettingsMenuChild {
    key: string
    label: string
}

interface SettingsMenuGroup {
    key: string
    label: string
    children: SettingsMenuChild[]
}

const BASE_SETTINGS_GROUPS: SettingsMenuGroup[] = [
    {
        key: "product",
        label: "Продукт",
        children: [
            {key: "product-categories", label: "Категории"},
            {key: "sizes", label: "Размеры"},
            {key: "colors", label: "Цвета"},
            {key: "product-variant-statuses", label: "Статусы"},
            {key: "product-properties", label: "Свойства"}
        ]
    },
    {
        key: "delivery",
        label: "Доставка",
        children: [{key: "countries", label: "Страны и города"}]
    },
    {
        key: "branch",
        label: "Филиал",
        children: [
            {key: "sales-points", label: "Точки продаж"},
            {key: "product-storages", label: "Склады"}
        ]
    },
    {
        key: "order",
        label: "Заказ",
        children: [{key: "sources", label: "Источник"}]
    }
]

const useStyles = createStyles(({token}) => ({
    wrapper: {
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16
    },
    menuCard: {
        borderRadius: token.borderRadiusLG + 4
    },
    contentCard: {
        borderRadius: token.borderRadiusLG + 4
    },
    menu: {
        borderInlineEnd: 0
    },
    menuHeader: {
        marginBottom: 10
    },
    menuSearch: {
        marginTop: 6
    },
    summary: {
        marginBottom: 12
    }
}))

const SettingsLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const {styles} = useStyles()
    const isSuperAdmin = useIsSuperAdmin()
    const [query, setQuery] = useState("")

    const groups = useMemo<SettingsMenuGroup[]>(() => {
        const result = [...BASE_SETTINGS_GROUPS]
        if (isSuperAdmin) {
            result.push({
                key: "admin",
                label: "Администрирование",
                children: [
                    {key: "employees", label: "Сотрудники"},
                    {key: "roles", label: "Роли"}
                ]
            })
        }
        return result
    }, [isSuperAdmin])

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

    // Определяем текущий активный ключ из pathname
    const selectedKey = location.pathname.split("/")[2]

    const onClickHandler: MenuProps["onClick"] = (e) => {
        navigate(`/settings/${e.key}`)
    }

    return (
        <div>
            <Typography.Title level={3} style={{marginTop: 0, marginBottom: 6}}>Настройки</Typography.Title>
            <Typography.Text type="secondary">
                Конфигурация справочников, статусов и служебных сущностей.
            </Typography.Text>
            <div className={styles.wrapper} style={{marginTop: 16}}>
                <Card className={styles.menuCard}>
                    <div className={styles.menuHeader}>
                        <Space className={styles.summary}>
                            <Tag color="blue">Разделов: {allChildrenCount}</Tag>
                            {isSuperAdmin && <Tag color="gold">SUPER_ADMIN</Tag>}
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
                    <Menu
                        className={styles.menu}
                        onClick={onClickHandler}
                        mode="inline"
                        items={items}
                        selectedKeys={[selectedKey]}
                    />
                </Card>
                <Card className={styles.contentCard}>
                    <Outlet />
                </Card>
            </div>
        </div>
    )
}

export default SettingsLayout
