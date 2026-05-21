import {Alert, Button, Card, Col, List, Progress, Row, Space, Tag, Typography} from "antd"
import {ReloadOutlined} from "@ant-design/icons"
import PageHeading from "../../components/PageHeading.tsx"
import {useNavigate} from "react-router-dom"
import {useGetSalesPointsQuery} from "../../features/settings/sales-point/salesPointApi.ts"
import {useGetStoragesQuery} from "../../features/settings/product-storage/productStorageApi.ts"
import {useGetCountriesQuery} from "../../features/settings/country/countryApi.ts"
import {useGetOrderStatusesQuery} from "../../features/order-status/orderStatusApi.ts"
import {useGetOrderStatusNotificationsQuery} from "../../features/order-notifications/orderNotificationApi.ts"

type ChecklistVerificationState = "confirmed" | "checking" | "failed"

interface ChecklistItem {
    title: string
    description: string
    done: boolean
    action: string
    path: string
    verificationState: ChecklistVerificationState
}

const getVerificationState = (query: {isError?: boolean; isLoading?: boolean; isFetching?: boolean}): ChecklistVerificationState => {
    if (query.isError) return "failed"
    if (query.isLoading || query.isFetching) return "checking"

    return "confirmed"
}

const getChecklistStatus = (item: ChecklistItem) => {
    if (item.verificationState === "failed") {
        return {color: "red", label: "Не проверено"}
    }
    if (item.verificationState === "checking") {
        return {color: "blue", label: "Проверяем"}
    }

    return item.done ? {color: "green", label: "Готово"} : {color: "orange", label: "Нужно"}
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
    const isInitialLoadingSetup = setupQueries.some((query) => query.isLoading)
    const isRefreshingSetup = setupQueries.some((query) => query.isFetching && !query.isLoading)
    const isCheckingSetup = isInitialLoadingSetup || isRefreshingSetup
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
            path: "/settings/sales-points",
            verificationState: getVerificationState(salesPointsQuery)
        },
        {
            title: "Склад / остатки",
            description: "База для reservedQty, low stock и выдачи товара без пересорта.",
            done: (storages?.length || 0) > 0,
            action: "Настроить склады",
            path: "/settings/product-storages",
            verificationState: getVerificationState(storagesQuery)
        },
        {
            title: "География доставки",
            description: "Страны и города нужны для checkout и адресов клиента.",
            done: countriesWithCities > 0,
            action: "Настроить города",
            path: "/settings/countries",
            verificationState: getVerificationState(countriesQuery)
        },
        {
            title: "Lifecycle заказа",
            description: "Минимум: новый → в работе → готов → доставлен/отменён.",
            done: (statuses?.length || 0) >= 4,
            action: "Настроить статусы",
            path: "/settings/order-statuses",
            verificationState: getVerificationState(statusesQuery)
        },
        {
            title: "Уведомления по статусам",
            description: "Правила уведомлений должны быть явными, чтобы менеджер понимал, что уйдёт клиенту.",
            done: (notifications?.length || 0) > 0,
            action: "Настроить уведомления",
            path: "/settings/notifications",
            verificationState: getVerificationState(notificationsQuery)
        },
        {
            title: "Payme callback",
            description: isPaymeCallbackReady
                ? "URL открыт на публичном HTTPS-домене; перед запуском всё равно проверьте тестовый заказ."
                : "Для production нужен публичный HTTPS-домен. Локальный или HTTP callback не переносим в Payme Business.",
            done: isPaymeCallbackReady,
            action: "Открыть платежи",
            path: "/settings/payments",
            verificationState: "confirmed"
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
                    action={<Button size="small" icon={<ReloadOutlined />} loading={isCheckingSetup} onClick={handleRetry}>Повторить проверку</Button>}
                />
            )}

            {isRefreshingSetup && !hasSetupError && (
                <Alert
                    type="info"
                    showIcon
                    message="Checklist настроек обновляется"
                    description="Показываем предыдущую подтверждённую картину, пока API перепроверяет точки, склады, географию, статусы и уведомления. Перед запуском продаж дождитесь завершения проверки."
                />
            )}

            {!isInitialLoadingSetup && !hasSetupError && attentionItems.length > 0 && (
                <Alert
                    type="info"
                    showIcon
                    message="Следующие настройки требуют внимания перед продажами"
                    description={(
                        <Space direction="vertical" size={8} style={{width: "100%"}}>
                            {attentionItems.slice(0, 3).map((item) => {
                                const status = getChecklistStatus(item)

                                return (
                                    <Space key={item.path} size={8} wrap>
                                        <Tag color={status.color}>{status.label}</Tag>
                                        <Typography.Text strong>{item.title}</Typography.Text>
                                        <Typography.Text type="secondary">{item.description}</Typography.Text>
                                        <Button size="small" onClick={() => navigate(item.path)}>{item.action}</Button>
                                    </Space>
                                )
                            })}
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
                    <Card title="Готовность настроек" loading={isInitialLoadingSetup && !hasSetupError}>
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
                    <Card title="Что проверить перед продажами">
                        <List
                            loading={isInitialLoadingSetup && !hasSetupError}
                            dataSource={checklist}
                            renderItem={(item) => {
                                const status = getChecklistStatus(item)
                                const description = item.verificationState === "failed"
                                    ? `${item.description} Проверка недоступна: обновите checklist перед запуском или изменением настроек.`
                                    : item.description

                                return (
                                    <List.Item
                                        actions={[<Button key="open" onClick={() => navigate(item.path)}>{item.action}</Button>]}
                                    >
                                        <List.Item.Meta
                                            title={<Space><Tag color={status.color}>{status.label}</Tag>{item.title}</Space>}
                                            description={description}
                                        />
                                    </List.Item>
                                )
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}

export default SettingsOverviewPage
