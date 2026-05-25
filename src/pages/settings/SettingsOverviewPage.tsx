import {Alert, Button, Card, Col, List, Progress, Row, Space, Tag, Typography} from "antd"
import PageHeading from "../../components/PageHeading.tsx"
import {useNavigate} from "react-router-dom"
import {useGetSalesPointsQuery} from "../../features/settings/sales-point/salesPointApi.ts"
import {useGetStoragesQuery} from "../../features/settings/product-storage/productStorageApi.ts"
import {useGetCountriesQuery} from "../../features/settings/country/countryApi.ts"
import {useGetOrderStatusesQuery} from "../../features/order-status/orderStatusApi.ts"
import {useGetOrderStatusNotificationsQuery} from "../../features/order-notifications/orderNotificationApi.ts"

interface ChecklistItem {
    title: string
    description: string
    done: boolean
    action: string
    path: string
}

const SettingsOverviewPage = () => {
    const navigate = useNavigate()
    const salesPointsQuery = useGetSalesPointsQuery()
    const storagesQuery = useGetStoragesQuery()
    const countriesQuery = useGetCountriesQuery()
    const statusesQuery = useGetOrderStatusesQuery()
    const notificationsQuery = useGetOrderStatusNotificationsQuery()

    const {data: salesPoints} = salesPointsQuery
    const {data: storages} = storagesQuery
    const {data: countries} = countriesQuery
    const {data: statuses} = statusesQuery
    const {data: notifications} = notificationsQuery
    const setupQueries = [salesPointsQuery, storagesQuery, countriesQuery, statusesQuery, notificationsQuery]
    const isLoadingSetup = setupQueries.some((query) => query.isLoading || query.isFetching)
    const hasSetupError = setupQueries.some((query) => query.isError)

    const countriesWithCities = (countries || []).filter((country) => (country.cities?.length || 0) > 0).length
    const {hostname, protocol} = window.location
    const callbackUrl = `${window.location.origin}/api/payme`
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)
    const isHttpsCallback = protocol === "https:"
    const isPaymeCallbackReady = isHttpsCallback && !isLocalHost

    const checklist: ChecklistItem[] = [
        {
            title: "Точка продаж",
            description: "Нужна, чтобы отделить retail-точки и будущие Datra-связки.",
            done: (salesPoints?.length || 0) > 0,
            action: "Настроить точки",
            path: "/settings/sales-points"
        },
        {
            title: "Склад / остатки",
            description: "База для reservedQty, low stock и выдачи товара без пересорта.",
            done: (storages?.length || 0) > 0,
            action: "Настроить склады",
            path: "/settings/product-storages"
        },
        {
            title: "География доставки",
            description: "Страны и города нужны для checkout и адресов клиента.",
            done: countriesWithCities > 0,
            action: "Настроить города",
            path: "/settings/countries"
        },
        {
            title: "Lifecycle заказа",
            description: "Минимум: новый → в работе → готов → доставлен/отменён.",
            done: (statuses?.length || 0) >= 4,
            action: "Настроить статусы",
            path: "/settings/order-statuses"
        },
        {
            title: "Уведомления по статусам",
            description: "Правила уведомлений должны быть явными, чтобы менеджер понимал, что уйдёт клиенту.",
            done: (notifications?.length || 0) > 0,
            action: "Настроить уведомления",
            path: "/settings/notifications"
        },
        {
            title: "Payme callback",
            description: isPaymeCallbackReady
                ? "URL открыт на публичном HTTPS-домене; перед запуском всё равно проверьте тестовый заказ."
                : "Для production нужен публичный HTTPS-домен. Локальный или HTTP callback не переносим в Payme Business.",
            done: isPaymeCallbackReady,
            action: "Открыть платежи",
            path: "/settings/payments"
        }
    ]

    const completed = checklist.filter((item) => item.done).length
    const attentionItems = checklist.filter((item) => !item.done)
    const progress = Math.round((completed / checklist.length) * 100)
    const progressStatus = hasSetupError ? "exception" : progress === 100 ? "success" : "active"
    const handleRetry = () => setupQueries.forEach((query) => query.refetch())

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                size="compact"
                eyebrow="Launch checklist"
                title="Запуск магазина"
                subtitle="Практический checklist настроек, без enterprise-конфигуратора и без дубля Datra."
                extra={<Tag color={progress === 100 ? "green" : "blue"}>{completed}/{checklist.length} готово</Tag>}
            />

            {hasSetupError && (
                <Alert
                    type="warning"
                    showIcon
                    message="Не удалось проверить часть настроек"
                    description="Checklist может быть неполным: обновите данные перед запуском продаж или изменением операционных настроек."
                    action={<Button size="small" onClick={handleRetry}>Повторить проверку</Button>}
                />
            )}

            {!isLoadingSetup && !hasSetupError && attentionItems.length > 0 && (
                <Alert
                    type="info"
                    showIcon
                    message="Следующие настройки требуют внимания перед продажами"
                    description={(
                        <Space direction="vertical" size={8} style={{width: "100%"}}>
                            {attentionItems.slice(0, 3).map((item) => (
                                <Space key={item.path} size={8} wrap>
                                    <Tag color="orange">Нужно</Tag>
                                    <Typography.Text strong>{item.title}</Typography.Text>
                                    <Typography.Text type="secondary">{item.description}</Typography.Text>
                                    <Button size="small" onClick={() => navigate(item.path)}>{item.action}</Button>
                                </Space>
                            ))}
                            {attentionItems.length > 3 && (
                                <Typography.Text type="secondary">
                                    Ещё задач: {attentionItems.length - 3}. Полный список ниже в checklist.
                                </Typography.Text>
                            )}
                        </Space>
                    )}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card className="admin-section-card settings-readiness-card" title="Готовность настроек" loading={isLoadingSetup && !hasSetupError}>
                        <Progress type="dashboard" percent={progress} status={progressStatus} />
                        <Typography.Paragraph type="secondary" style={{marginTop: 16}}>
                            Цель — убрать блокеры запуска магазина: точка, склад, доставка, статусы, уведомления и Payme callback.
                        </Typography.Paragraph>
                        <Space wrap size={[8, 8]} style={{marginBottom: 8}}>
                            <Tag color={isHttpsCallback ? "green" : "orange"}>{isHttpsCallback ? "HTTPS" : "Не HTTPS"}</Tag>
                            <Tag color={isLocalHost ? "orange" : "green"}>{isLocalHost ? "Локальный домен" : "Публичный домен"}</Tag>
                        </Space>
                        <Typography.Text copyable>{callbackUrl}</Typography.Text>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card className="admin-section-card" title="Что проверить перед продажами">
                        <List
                            loading={isLoadingSetup && !hasSetupError}
                            dataSource={checklist}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[<Button key="open" onClick={() => navigate(item.path)}>{item.action}</Button>]}
                                >
                                    <List.Item.Meta
                                        title={<Space><Tag color={item.done ? "green" : "orange"}>{item.done ? "Готово" : "Нужно"}</Tag>{item.title}</Space>}
                                        description={item.description}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}

export default SettingsOverviewPage
