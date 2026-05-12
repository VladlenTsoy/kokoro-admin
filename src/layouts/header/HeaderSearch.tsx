import {Input} from "antd"
import {SearchOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"
import {useNavigate} from "react-router-dom"

const {Search} = Input

const MANAGER_SHORTCUTS: Array<{keywords: string[]; path: string}> = [
    {keywords: ["проблем", "ошибка заказа", "problem", "attention"], path: "/orders?problemOnly=1"},
    {keywords: ["внимания", "срочно", "urgent"], path: "/orders?attentionOnly=1"},
    {keywords: ["оплачен", "оплаченные", "paid"], path: "/orders?paymentStatus=paid"},
    {keywords: ["ждет оплат", "ждёт оплат", "pending payment"], path: "/orders?paymentStatus=pending"},
    {keywords: ["готов", "выдач", "handoff", "ready"], path: "/orders?deliveryStatus=ready"},
    {keywords: ["новые заказ", "принять заказ", "new order"], path: "/orders?deliveryStatus=pending"},
    {keywords: ["заказ", "заказы", "order", "orders", "доставка", "оплата"], path: "/orders"},
    {keywords: ["клиент", "клиенты", "client", "clients", "покупатель", "телефон"], path: "/clients"},
    {keywords: ["товар", "товары", "catalog", "product", "products", "каталог", "артикул"], path: "/products"},
    {keywords: ["поиск", "ноль", "нет результатов", "zero", "analytics"], path: "/search-zero-results"},
    {keywords: ["сотрудник", "сотрудники", "employee", "staff", "доступ"], path: "/settings/employees"},
    {keywords: ["роль", "роли", "permission", "permissions", "права"], path: "/settings/roles"},
    {keywords: ["промо", "promo", "скидка", "промокод"], path: "/settings/promo-codes"},
    {keywords: ["интеграции", "интеграция", "integration", "payme", "datra"], path: "/settings/integrations"},
    {keywords: ["настройки", "settings", "чеклист", "запуск"], path: "/settings/overview"}
]

const searchableProductPattern = /(?:^|\s)(?:sku|id|артикул|товар)[:#\s-]*[\wа-яё-]+/iu
const orderSearchPattern = /(?:^|\s)(?:заказ|order|номер)[:#№\s-]+([\wа-яё-]+)/iu
const phoneSearchPattern = /(?:^|\s)(?:\+?998|8|\+)?[\d\s()\-.]{7,}\d(?:\s|$)/u

const useStyles = createStyles(({token}) => ({
    search: {
        width: 280,
        maxWidth: "38vw",
        "& .ant-input-affix-wrapper": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder,
            background: token.colorBgContainer
        },
        "@media (max-width: 760px)": {
            width: "100%",
            maxWidth: "100%"
        }
    }
}))

function resolveManagerSearchPath(rawValue: string) {
    const query = rawValue.trim()
    const normalized = query.toLocaleLowerCase("ru-RU")

    if (!normalized) return "/"

    const orderMatch = query.match(orderSearchPattern)
    if (orderMatch?.[1]) {
        return `/orders?search=${encodeURIComponent(orderMatch[1])}`
    }

    const shortcut = MANAGER_SHORTCUTS.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)))
    if (shortcut) return shortcut.path

    if (phoneSearchPattern.test(query)) {
        return `/clients?search=${encodeURIComponent(query)}`
    }

    if (searchableProductPattern.test(query)) {
        return `/products?search=${encodeURIComponent(query.replace(/^(sku|id|артикул|товар)[:#\s-]*/iu, ""))}`
    }

    return `/products?search=${encodeURIComponent(query)}`
}

const HeaderSearch = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()

    return (
        <Search
            className={styles.search}
            size="large"
            placeholder="Заказ, клиент, SKU или очередь..."
            allowClear
            enterButton="Найти"
            prefix={<SearchOutlined />}
            aria-label="Глобальный поиск и быстрый переход по админке"
            onSearch={(value) => navigate(resolveManagerSearchPath(value))}
        />
    )
}

export default HeaderSearch
