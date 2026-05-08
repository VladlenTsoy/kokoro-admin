import {Card, Space, Statistic, Table, Tag, Typography} from "antd"
import {SearchOutlined} from "@ant-design/icons"
import type {ColumnsType} from "antd/es/table"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {type SearchZeroResultItem, useGetSearchZeroResultsQuery} from "../features/search-zero-results/searchZeroResultApi.ts"

const SearchZeroResultsPage = () => {
    const {data = [], isLoading} = useGetSearchZeroResultsQuery()
    const totalSearches = data.reduce((sum, item) => sum + Number(item.count || 0), 0)
    const latest = data[0]?.lastSearchedAt

    const columns: ColumnsType<SearchZeroResultItem> = [
        {
            title: "Запрос",
            dataIndex: "query",
            render: (value: string) => <Typography.Text strong>{value}</Typography.Text>
        },
        {
            title: "Количество",
            dataIndex: "count",
            width: 140,
            sorter: (a, b) => a.count - b.count,
            defaultSortOrder: "descend",
            render: (value: number) => <Tag color={value > 1 ? "orange" : "blue"}>{value}</Tag>
        },
        {
            title: "Последний запрос",
            dataIndex: "lastSearchedAt",
            width: 200,
            render: (value?: string) => (value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "—")
        }
    ]

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <Card className="admin-hero-card">
                <PageHeading
                    title="Поиск без результата"
                    subtitle="Агрегированные запросы из сайта, где покупатель ничего не нашёл. Без персональных данных."
                />
            </Card>

            <Space size={16} wrap>
                <Card className="metric-card metric-card--cyan">
                    <Statistic prefix={<SearchOutlined />} title="Уникальные запросы" value={data.length} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--blue">
                    <Statistic title="Всего неуспешных поисков" value={totalSearches} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--lime">
                    <Statistic title="Последний сигнал" value={latest ? dayjs(latest).format("DD.MM HH:mm") : "—"} loading={isLoading} />
                </Card>
            </Space>

            <Card className="admin-table-card">
                <Table<SearchZeroResultItem>
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={data}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                />
            </Card>
        </Space>
    )
}

export default SearchZeroResultsPage
