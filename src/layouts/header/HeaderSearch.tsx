import {Input, message} from "antd"
import {SearchOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"
import {useMemo} from "react"
import {useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"
import type {PermissionCode} from "../../features/auth/authTypes.ts"

const {Search} = Input

const useStyles = createStyles(({token}) => ({
    search: {
        width: 320,
        maxWidth: "40vw",
        "& .ant-input-affix-wrapper": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder,
            background: token.colorBgContainer
        },
        "@media (max-width: 1100px)": {
            width: "min(100%, 360px)",
            maxWidth: "100%"
        },
        "@media (max-width: 520px)": {
            width: "100%"
        }
    }
}))

type SearchDestination = {
    title: string
    path: (query: string) => string
    permission: PermissionCode
    keywords: string[]
}

const searchDestinations: SearchDestination[] = [
    {
        title: "Заказы",
        path: () => "/orders",
        permission: "orders.read",
        keywords: ["order", "orders", "заказ", "заказы", "оплат", "достав", "отмен"]
    },
    {
        title: "Каталог",
        path: (query) => `/products?search=${encodeURIComponent(query)}&current=1`,
        permission: "catalog.read",
        keywords: ["product", "products", "catalog", "каталог", "товар", "одеж", "карточ", "размер", "цвет"]
    },
    {
        title: "Клиенты",
        path: () => "/clients",
        permission: "clients.read",
        keywords: ["client", "clients", "customer", "клиент", "клиенты", "покупатель", "телефон", "phone"]
    },
    {
        title: "Настройки",
        path: () => "/settings",
        permission: "settings.read",
        keywords: ["settings", "настрой", "интеграц", "платеж", "статус", "сотруд", "роль"]
    },
    {
        title: "Нулевые поиски",
        path: () => "/search-zero-results",
        permission: "catalog.read",
        keywords: ["zero", "ноль", "нулев", "поиск"]
    }
]

const HeaderSearch = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()
    const {employee} = useSelectedAuthData()

    const availableDestinations = useMemo(
        () => searchDestinations.filter((destination) => can(employee?.permissions, destination.permission)),
        [employee?.permissions]
    )

    const onSearch = (value: string) => {
        const query = value.trim()

        if (!query) {
            message.info("Введите запрос: заказ, товар, клиент или настройка")
            return
        }

        const normalizedQuery = query.toLowerCase()
        const destination = availableDestinations.find((item) =>
            item.keywords.some((keyword) => normalizedQuery.includes(keyword))
        ) ?? availableDestinations.find((item) => item.permission === "catalog.read") ?? availableDestinations[0]

        if (!destination) {
            message.warning("Для поиска нет доступных разделов в текущих правах")
            return
        }

        navigate(destination.path(query))
        message.success(`Открыт раздел: ${destination.title}`)
    }

    return (
        <Search
            className={styles.search}
            size="large"
            placeholder="Быстрый переход: заказ, товар, клиент..."
            allowClear
            prefix={<SearchOutlined />}
            enterButton="Открыть"
            onSearch={onSearch}
        />
    )
}

export default HeaderSearch
