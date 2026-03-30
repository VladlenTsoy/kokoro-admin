import {Avatar, Button, Card, Col, Input, Row, Space, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import {UserOutlined} from "@ant-design/icons"
import PageHeading from "../components/PageHeading.tsx"

interface ClientRow {
    id: number
    name: string
    phone: string
    orders: number
    ltv: string
    segment: "VIP" | "Standard" | "New"
}

const rows: ClientRow[] = [
    {id: 1, name: "Madina Saidova", phone: "+998 90 111-22-33", orders: 14, ltv: "7 420 000 сум", segment: "VIP"},
    {id: 2, name: "Dilshod Rasulov", phone: "+998 93 555-00-91", orders: 4, ltv: "1 560 000 сум", segment: "Standard"},
    {id: 3, name: "Kamola Nur", phone: "+998 99 401-09-44", orders: 1, ltv: "210 000 сум", segment: "New"}
]

const ClientsPage = () => {
    const columns: ColumnsType<ClientRow> = [
        {
            title: "Клиент",
            dataIndex: "name",
            render: (name: string) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Typography.Text>{name}</Typography.Text>
                </Space>
            )
        },
        {title: "Телефон", dataIndex: "phone"},
        {title: "Заказов", dataIndex: "orders", width: 120},
        {title: "LTV", dataIndex: "ltv"},
        {
            title: "Сегмент",
            dataIndex: "segment",
            render: (segment: ClientRow["segment"]) => {
                if (segment === "VIP") return <Tag color="gold">VIP</Tag>
                if (segment === "Standard") return <Tag color="blue">Standard</Tag>
                return <Tag color="green">New</Tag>
            }
        }
    ]

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Клиенты"
                subtitle="Единая база клиентов с сегментами и историей ценности."
                extra={<Button type="primary">Добавить клиента</Button>}
            />

            <Card>
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                        <Input placeholder="Поиск по имени, телефону, email" />
                    </Col>
                    <Col xs={24} md={12}>
                        <Input placeholder="Фильтр по сегменту" />
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table<ClientRow> rowKey="id" dataSource={rows} columns={columns} pagination={false} />
            </Card>
        </Space>
    )
}

export default ClientsPage
