import {Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import PageHeading from "../components/PageHeading.tsx"
import {useGetOrdersSummaryQuery} from "../features/orders/orderApi.ts"
import type {OrdersSummaryActivityItem} from "../features/orders/OrderTypes.ts"
import {useNavigate} from "react-router-dom"
import {formatMoney} from "../utils/formatters.ts"
import dayjs from "dayjs"

const HomePage = () => {
    const navigate = useNavigate()
    const {data: summary, isLoading} = useGetOrdersSummaryQuery(undefined, {refetchOnMountOrArgChange: true})
    const problemCount = summary?.problemToday ?? 0
    const hasProblems = problemCount > 0

    const openOrders = (params?: string) => navigate(params ? `/orders?${params}` : "/orders")

    const columns: ColumnsType<OrdersSummaryActivityItem> = [
        {
            title: "Событие",
            dataIndex: "event",
            render: (_, item) => (
                <Space orientation="vertical" size={0}>
                    <Typography.Text strong>{item.orderNumber || (item.orderId ? `#${item.orderId}` : "Заказ")}</Typography.Text>
                    <Typography.Text type="secondary">{item.event || "Статус заказа изменён"}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Переход",
            key: "transition",
            width: 240,
            render: (_, item) => (
                <Space wrap size={[4, 4]}>
                    {item.fromStatus && <Tag>{item.fromStatus}</Tag>}
                    {item.toStatus && <Tag color="blue">{item.toStatus}</Tag>}
                </Space>
            )
        },
        {title: "Кто", dataIndex: "changedBy", width: 180, render: (value?: string) => value || "Система"},
        {
            title: "Когда",
            dataIndex: "changedAt",
            width: 160,
            render: (value?: string) => (value ? dayjs(value).format("DD.MM HH:mm") : "—")
        }
    ]

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Today Operations"
                subtitle="Что требует внимания магазина сегодня: заказы, выручка и проблемные состояния без лишней аналитики."
                extra={(
                    <Space wrap>
                        <Button danger={hasProblems} type={hasProblems ? "primary" : "default"} onClick={() => openOrders("problemOnly=1")}>
                            Проблемные заказы
                        </Button>
                        <Button type="primary" onClick={() => openOrders("deliveryStatus=pending")}>
                            Новые заказы
                        </Button>
                    </Space>
                )}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={4}>
                    <Card hoverable onClick={() => openOrders()}>
                        <Statistic title="Заказы сегодня" value={summary?.ordersToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card hoverable onClick={() => openOrders("deliveryStatus=pending")}>
                        <Statistic title="Новые" value={summary?.newOrders ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card hoverable onClick={() => openOrders("deliveryStatus=preparing")}>
                        <Statistic title="В работе" value={summary?.inProgressToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card hoverable onClick={() => openOrders("deliveryStatus=ready")}>
                        <Statistic title="Готовы" value={summary?.readyToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card hoverable onClick={() => openOrders("problemOnly=1")}>
                        <Statistic title="Проблемные" value={problemCount} loading={isLoading} valueStyle={{color: hasProblems ? "#cf1322" : undefined}} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card>
                        <Statistic title="Выручка сегодня" value={formatMoney(summary?.revenueToday ?? 0)} loading={isLoading} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={8}>
                    <Card title="Операционный фокус">
                        <Space orientation="vertical" size={12} style={{width: "100%"}}>
                            <Typography.Text>
                                {hasProblems
                                    ? "Сначала разберите проблемные заказы: просроченные новые, оплаченные без обработки, failed payment или paid + cancelled."
                                    : "Критичных проблем по заказам сегодня не видно. Держите фокус на новых и готовых заказах."}
                            </Typography.Text>
                            <Button danger={hasProblems} type={hasProblems ? "primary" : "default"} onClick={() => openOrders("problemOnly=1")}>
                                Открыть очередь проблем
                            </Button>
                            <Button onClick={() => openOrders("deliveryStatus=ready")}>Проверить готовые к выдаче</Button>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} xl={16}>
                    <Card title="Последние события по заказам">
                        {(summary?.recentActivity?.length ?? 0) > 0 ? (
                            <Table<OrdersSummaryActivityItem>
                                rowKey="id"
                                columns={columns}
                                dataSource={summary?.recentActivity || []}
                                pagination={false}
                                size="middle"
                            />
                        ) : (
                            <Empty description="Пока нет событий по заказам" />
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}

export default HomePage
