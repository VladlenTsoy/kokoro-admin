import {Button, Card, Col, List, Progress, Row, Space, Tag, Typography} from "antd"
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
    const {data: salesPoints} = useGetSalesPointsQuery()
    const {data: storages} = useGetStoragesQuery()
    const {data: countries} = useGetCountriesQuery()
    const {data: statuses} = useGetOrderStatusesQuery()
    const {data: notifications} = useGetOrderStatusNotificationsQuery()

    const countriesWithCities = (countries || []).filter((country) => (country.cities?.length || 0) > 0).length
    const callbackUrl = `${window.location.origin}/api/payme`

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
            description: "URL должен быть передан в Payme Business; автоматический refund не включаем без отдельной проверки.",
            done: true,
            action: "Открыть платежи",
            path: "/settings/payments"
        }
    ]

    const completed = checklist.filter((item) => item.done).length
    const progress = Math.round((completed / checklist.length) * 100)

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Запуск магазина"
                subtitle="Практический checklist настроек, без enterprise-конфигуратора и без дубля Datra."
                extra={<Tag color={progress === 100 ? "green" : "blue"}>{completed}/{checklist.length} готово</Tag>}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="Готовность настроек">
                        <Progress type="dashboard" percent={progress} />
                        <Typography.Paragraph type="secondary" style={{marginTop: 16}}>
                            Цель — убрать блокеры запуска магазина: точка, склад, доставка, статусы, уведомления и Payme callback.
                        </Typography.Paragraph>
                        <Typography.Text copyable>{callbackUrl}</Typography.Text>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="Что проверить перед продажами">
                        <List
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
