import {Button, Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import PageHeading from "../components/PageHeading.tsx"
import {useGetOrdersSummaryQuery} from "../features/orders/orderApi.ts"
import {useNavigate} from "react-router-dom"

interface FeedItem {
    id: number
    event: string
    actor: string
    date: string
    status: "ok" | "warning" | "pending"
}

const feed: FeedItem[] = [
    {id: 1, event: "Обновлён статус заказа #8412", actor: "Система", date: "Сегодня, 13:14", status: "ok"},
    {id: 2, event: "Добавлен сотрудник Amanova", actor: "Super Admin", date: "Сегодня, 12:48", status: "pending"},
    {id: 3, event: "Изменена роль MANAGER", actor: "Super Admin", date: "Сегодня, 10:10", status: "warning"}
]

const HomePage = () => {
    const navigate = useNavigate()
    const {data: summary, isLoading} = useGetOrdersSummaryQuery()
    const columns: ColumnsType<FeedItem> = [
        {title: "Событие", dataIndex: "event"},
        {title: "Кто", dataIndex: "actor", width: 160},
        {title: "Когда", dataIndex: "date", width: 180},
        {
            title: "Статус",
            dataIndex: "status",
            width: 130,
            render: (status: FeedItem["status"]) => {
                if (status === "ok") return <Tag color="green">ОК</Tag>
                if (status === "warning") return <Tag color="orange">Важно</Tag>
                return <Tag color="blue">В работе</Tag>
            }
        }
    ]

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Панель управления"
                subtitle="Срез по операционным метрикам и последним изменениям."
                extra={(
                    <Button type="primary" onClick={() => navigate("/orders?statusId=1")}>
                        Новые заказы
                    </Button>
                )}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title="Заказы сегодня" value={summary?.ordersToday ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title="Новые заказы" value={summary?.newOrders ?? 0} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title="Выручка сегодня" value={summary?.revenueToday ?? 0} loading={isLoading} suffix="сум" />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title="Ошибок API (24ч)" value={2} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                    <Card>
                        <Typography.Title level={5} style={{marginTop: 0}}>
                            Выполнение KPI
                        </Typography.Title>
                        <Space direction="vertical" style={{width: "100%"}} size={14}>
                            <div>
                                <Typography.Text>Обработка заказов</Typography.Text>
                                <Progress percent={84} strokeColor="#79D6FF" />
                            </div>
                            <div>
                                <Typography.Text>Ответ клиенту до 15 мин</Typography.Text>
                                <Progress percent={71} strokeColor="#C5FF3E" />
                            </div>
                            <div>
                                <Typography.Text>Актуальность карточек</Typography.Text>
                                <Progress percent={92} strokeColor="#8E94FF" />
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} xl={14}>
                    <Card>
                        <Typography.Title level={5} style={{marginTop: 0}}>
                            Лента активности
                        </Typography.Title>
                        <Table<FeedItem> rowKey="id" columns={columns} dataSource={feed} pagination={false} />
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}

export default HomePage
