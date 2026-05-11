import {Alert, Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography} from "antd"
import {AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, ReloadOutlined, ShoppingOutlined, SwapRightOutlined, ThunderboltOutlined} from "@ant-design/icons"
import type {ColumnsType} from "antd/es/table"
import PageHeading from "../components/PageHeading.tsx"
import {useGetOrdersSummaryQuery} from "../features/orders/orderApi.ts"
import type {OrdersSummaryActivityItem} from "../features/orders/OrderTypes.ts"
import {useNavigate} from "react-router-dom"
import {formatMoney} from "../utils/formatters.ts"
import {getGenericStatusMeta} from "../utils/adminStatusMeta.ts"
import dayjs from "dayjs"

const HomePage = () => {
    const navigate = useNavigate()
    const {data: summary, isLoading, isFetching, error: summaryError, refetch} = useGetOrdersSummaryQuery(undefined, {refetchOnMountOrArgChange: true})
    const problemCount = summary?.problemToday ?? 0
    const hasProblems = problemCount > 0

    const openOrders = (params?: string) => navigate(params ? `/orders?${params}` : "/orders")
    const nextActionShortcuts = [
        {
            title: "Оплаченные без обработки",
            description: "Первый риск смены: деньги уже пришли, заказ ещё не принят.",
            query: "paymentStatus=paid&deliveryStatus=pending",
            danger: true
        },
        {
            title: "Проблемная очередь",
            description: "Просрочки, отмены после оплаты и другие заказы, где нужен менеджер.",
            query: "problemOnly=1",
            danger: hasProblems
        },
        {
            title: "Готовые к выдаче",
            description: "Заказы, которые можно быстрее закрыть или передать клиенту/курьеру.",
            query: "deliveryStatus=ready",
            danger: false
        }
    ]

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
            width: 260,
            render: (_, item) => {
                const fromStatus = getGenericStatusMeta(item.fromStatus)
                const toStatus = getGenericStatusMeta(item.toStatus)

                if (!fromStatus && !toStatus) return <Typography.Text type="secondary">Без изменения статуса</Typography.Text>

                return (
                    <Space wrap size={[4, 4]}>
                        {fromStatus && <Tag color={fromStatus.color}>{fromStatus.label}</Tag>}
                        {fromStatus && toStatus && <SwapRightOutlined style={{color: "#8c8c8c"}} />}
                        {toStatus && <Tag color={toStatus.color || "blue"}>{toStatus.label}</Tag>}
                    </Space>
                )
            }
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
            <Card className="admin-hero-card dashboard-hero">
                <PageHeading
                    title="Today Operations"
                    subtitle="Живой пульт магазина: что горит, где деньги и какие заказы требуют реакции прямо сейчас."
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
                <div className="dashboard-hero-strip">
                    <span>Фокус смены</span>
                    <Typography.Text>
                        {hasProblems ? "Есть риски: сначала разберите красную очередь." : "Очередь выглядит спокойно — держим скорость обработки."}
                    </Typography.Text>
                </div>
            </Card>

            {summaryError && (
                <Alert
                    type="warning"
                    showIcon
                    message="Не удалось обновить операционную сводку"
                    description="Показатели смены могут быть неполными. Перед решениями по проблемным заказам обновите сводку или откройте журнал заказов."
                    action={(
                        <Space wrap>
                            <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                                Повторить
                            </Button>
                            <Button size="small" type="primary" onClick={() => openOrders()}>
                                Открыть заказы
                            </Button>
                        </Space>
                    )}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={4}>
                    <Card className="metric-card metric-card--lime" hoverable onClick={() => openOrders()}>
                        <Statistic prefix={<ShoppingOutlined />} title="Заказы сегодня" value={summary?.ordersToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card className="metric-card metric-card--orange" hoverable onClick={() => openOrders("deliveryStatus=pending")}>
                        <Statistic prefix={<ClockCircleOutlined />} title="Новые" value={summary?.newOrders ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card className="metric-card metric-card--blue" hoverable onClick={() => openOrders("deliveryStatus=preparing")}>
                        <Statistic prefix={<ThunderboltOutlined />} title="В работе" value={summary?.inProgressToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card className="metric-card metric-card--cyan" hoverable onClick={() => openOrders("deliveryStatus=ready")}>
                        <Statistic prefix={<CheckCircleOutlined />} title="Готовы" value={summary?.readyToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card className={hasProblems ? "metric-card metric-card--danger" : "metric-card"} hoverable onClick={() => openOrders("problemOnly=1")}>
                        <Statistic prefix={<AlertOutlined />} title="Проблемные" value={problemCount} loading={isLoading} valueStyle={{color: hasProblems ? "#cf1322" : undefined}} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Card className="metric-card metric-card--money">
                        <Statistic prefix={<FireOutlined />} title="Выручка сегодня" value={formatMoney(summary?.revenueToday ?? 0)} loading={isLoading} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={8}>
                    <Card className="focus-card" title="Операционный фокус">
                        <Space orientation="vertical" size={12} style={{width: "100%"}}>
                            <Typography.Text>
                                {hasProblems
                                    ? "Сначала разберите проблемные заказы: просроченные новые, оплаченные без обработки, неуспешную оплату или оплаченные отмены."
                                    : "Критичных проблем по заказам сегодня не видно. Держите фокус на новых и готовых заказах."}
                            </Typography.Text>
                            <Space orientation="vertical" size={8} style={{width: "100%"}}>
                                {nextActionShortcuts.map((shortcut) => (
                                    <Button
                                        key={shortcut.query}
                                        block
                                        className="dashboard-focus-action"
                                        danger={shortcut.danger}
                                        onClick={() => openOrders(shortcut.query)}
                                    >
                                        <Space orientation="vertical" size={0} style={{width: "100%"}}>
                                            <Typography.Text strong>{shortcut.title}</Typography.Text>
                                            <Typography.Text type="secondary">{shortcut.description}</Typography.Text>
                                        </Space>
                                    </Button>
                                ))}
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} xl={16}>
                    <Card className="admin-table-card" title="Последние события по заказам">
                        {summaryError && !summary?.recentActivity?.length ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Историю событий сейчас не удалось загрузить"
                            >
                                <Space wrap>
                                    <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                                        Повторить загрузку
                                    </Button>
                                    <Button type="primary" onClick={() => openOrders()}>Открыть журнал заказов</Button>
                                </Space>
                            </Empty>
                        ) : (summary?.recentActivity?.length ?? 0) > 0 ? (
                            <Table<OrdersSummaryActivityItem>
                                rowKey="id"
                                columns={columns}
                                dataSource={summary?.recentActivity || []}
                                pagination={false}
                                size="middle"
                                loading={isLoading}
                                scroll={{x: 720}}
                            />
                        ) : (
                            <Empty description={isLoading ? "Загружаем последние события смены..." : "Пока нет событий по заказам"}>
                                {!isLoading && <Button onClick={() => openOrders()}>Открыть журнал заказов</Button>}
                            </Empty>
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}

export default HomePage
