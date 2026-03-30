import {Button, Card, Col, Input, Row, Space, Table, Tag} from "antd"
import type {ColumnsType} from "antd/es/table"
import PageHeading from "../components/PageHeading.tsx"

interface OrderRow {
    id: number
    customer: string
    amount: string
    source: string
    status: "Новый" | "Подтверждён" | "Отправлен"
}

const rows: OrderRow[] = [
    {id: 8412, customer: "Aliyev A.", amount: "1 240 000 сум", source: "Instagram", status: "Новый"},
    {id: 8411, customer: "Saidova M.", amount: "430 000 сум", source: "Сайт", status: "Подтверждён"},
    {id: 8408, customer: "Usmanov D.", amount: "980 000 сум", source: "Telegram", status: "Отправлен"}
]

const OrdersPage = () => {
    const columns: ColumnsType<OrderRow> = [
        {title: "№", dataIndex: "id", width: 90},
        {title: "Клиент", dataIndex: "customer"},
        {title: "Сумма", dataIndex: "amount"},
        {title: "Источник", dataIndex: "source"},
        {
            title: "Статус",
            dataIndex: "status",
            render: (status: OrderRow["status"]) => {
                if (status === "Новый") return <Tag color="blue">{status}</Tag>
                if (status === "Подтверждён") return <Tag color="orange">{status}</Tag>
                return <Tag color="green">{status}</Tag>
            }
        }
    ]

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Заказы"
                subtitle="Оперативный список заказов с фильтрацией и быстрыми действиями."
                extra={<Button type="primary">Создать заказ</Button>}
            />

            <Card>
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}><Input placeholder="Поиск по номеру/клиенту" /></Col>
                    <Col xs={24} md={8}><Input placeholder="Фильтр по источнику" /></Col>
                    <Col xs={24} md={8}><Input placeholder="Фильтр по статусу" /></Col>
                </Row>
            </Card>

            <Card>
                <Table<OrderRow> rowKey="id" dataSource={rows} columns={columns} pagination={false} />
            </Card>
        </Space>
    )
}

export default OrdersPage
