import {Alert, Button, Card, Result, Space, Typography, message} from "antd"
import {CopyOutlined, SearchOutlined} from "@ant-design/icons"
import {useMemo} from "react"
import {useLocation, useNavigate} from "react-router-dom"

const {Text} = Typography

type RecoveryAction = {
    label: string
    path: string
    note: string
    primary?: boolean
}

const extractLikelyOrderNumber = (requestedPath: string) => {
    const orderNumberMatch = requestedPath.match(/(?:order|orders|заказ|zakaz)[^0-9]{0,12}(\d{3,})/i)
    const fallbackNumberMatch = requestedPath.match(/\b\d{4,}\b/)

    return orderNumberMatch?.[1] ?? fallbackNumberMatch?.[0]
}

const getRecoveryActions = (requestedPath: string): RecoveryAction[] => {
    const normalizedPath = requestedPath.toLowerCase()

    if (normalizedPath.includes("order")) {
        const likelyOrderNumber = extractLikelyOrderNumber(requestedPath)

        return [
            likelyOrderNumber
                ? {
                    label: `Найти заказ №${likelyOrderNumber}`,
                    path: `/orders?search=${encodeURIComponent(likelyOrderNumber)}`,
                    note: "Открыть стол заказов сразу с поиском по номеру из битой ссылки.",
                    primary: true
                }
                : {label: "Открыть стол заказов", path: "/orders", note: "Проверить очередь, статус оплаты/доставки и карточку заказа.", primary: true},
            {label: "Проблемная очередь", path: "/orders?problemOnly=1", note: "Быстро найти заказы, где нужна реакция менеджера."}
        ]
    }

    if (normalizedPath.includes("client") || normalizedPath.includes("crm")) {
        return [
            {label: "Открыть CRM клиентов", path: "/clients", note: "Найти клиента, историю заказов и статус блокировки.", primary: true},
            {label: "К заказам", path: "/orders", note: "Если ссылка была из заказа, проверьте его через рабочий стол."}
        ]
    }

    if (normalizedPath.includes("product") || normalizedPath.includes("catalog") || normalizedPath.includes("sku")) {
        return [
            {label: "Открыть каталог", path: "/products", note: "Найти товар, фото, остатки и публикацию.", primary: true},
            {label: "Аналитика поиска", path: "/search-zero-results", note: "Проверить спрос и нулевые результаты поиска."}
        ]
    }

    if (normalizedPath.includes("setting") || normalizedPath.includes("admin") || normalizedPath.includes("role") || normalizedPath.includes("employee")) {
        return [
            {label: "Открыть настройки", path: "/settings/overview", note: "Перейти к запусковому чек-листу и справочникам.", primary: true},
            {label: "Доступы сотрудников", path: "/settings/employees", note: "Проверить роли и доступы, если ссылка была про админ-права."}
        ]
    }

    return [
        {label: "На дашборд", path: "/", note: "Вернуться к фокусу смены и последним событиям.", primary: true},
        {label: "К заказам", path: "/orders", note: "Открыть основной рабочий раздел менеджера."}
    ]
}

const NotFoundPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const requestedPath = `${location.pathname}${location.search}`
    const recoveryActions = useMemo(() => getRecoveryActions(requestedPath), [requestedPath])

    const copyRequestedPath = async () => {
        try {
            await navigator.clipboard.writeText(requestedPath)
            message.success("Адрес скопирован")
        } catch {
            message.warning("Не удалось скопировать адрес автоматически")
        }
    }

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <Result
                status="404"
                title="Раздел не найден"
                subTitle={
                    <Space direction="vertical" size={4}>
                        <Text>Адрес {requestedPath} не совпал с доступными разделами админки.</Text>
                        <Text type="secondary">
                            Проверьте ссылку или выберите ближайший рабочий раздел, чтобы не потерять контекст смены.
                        </Text>
                    </Space>
                }
                extra={
                    <Space wrap>
                        {recoveryActions.map((action) => (
                            <Button key={action.path} type={action.primary ? "primary" : "default"} onClick={() => navigate(action.path)}>
                                {action.label}
                            </Button>
                        ))}
                        <Button icon={<CopyOutlined />} onClick={copyRequestedPath}>Скопировать адрес</Button>
                        <Button onClick={() => navigate(-1)}>Назад</Button>
                    </Space>
                }
            />

            <Card title="Куда перейти сейчас">
                <Space direction="vertical" size={10} style={{width: "100%"}}>
                    {recoveryActions.map((action) => (
                        <Alert
                            key={action.path}
                            type={action.primary ? "info" : "success"}
                            showIcon
                            icon={action.primary ? <SearchOutlined /> : undefined}
                            message={action.label}
                            description={action.note}
                            action={<Button size="small" onClick={() => navigate(action.path)}>Открыть</Button>}
                        />
                    ))}
                </Space>
            </Card>
        </Space>
    )
}

export default NotFoundPage
