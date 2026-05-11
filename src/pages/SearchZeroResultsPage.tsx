import {Alert, Button, Card, Empty, Space, Statistic, Table, Tag, Typography} from "antd"
import {ReloadOutlined, SearchOutlined} from "@ant-design/icons"
import type {ColumnsType} from "antd/es/table"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {type SearchZeroResultItem, useGetSearchZeroResultsQuery} from "../features/search-zero-results/searchZeroResultApi.ts"

const SearchZeroResultsPage = () => {
    const {data = [], isLoading, isFetching, error, refetch} = useGetSearchZeroResultsQuery()
    const sortedData = [...data].sort((a, b) => dayjs(b.lastSearchedAt).valueOf() - dayjs(a.lastSearchedAt).valueOf())
    const totalSearches = sortedData.reduce((sum, item) => sum + Number(item.count || 0), 0)
    const latest = sortedData[0]?.lastSearchedAt
    const repeatedSignals = sortedData.filter((item) => Number(item.count || 0) > 1).length

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
                <Alert
                    type="info"
                    showIcon
                    message="Как использовать сигналы"
                    description="Проверьте повторяющиеся запросы: их стоит добавить в названия, теги, синонимы или карточки товара. Это снижает потерянный спрос без просмотра персональных данных покупателей."
                    style={{marginTop: 16}}
                />
            </Card>

            {error ? (
                <Alert
                    type="error"
                    showIcon
                    message="Не удалось загрузить поисковые сигналы"
                    description="Обновите данные. Если ошибка повторится, проверьте доступ к API и не принимайте решения по устаревшей таблице."
                    action={
                        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
                            Повторить
                        </Button>
                    }
                />
            ) : null}

            <Space size={16} wrap>
                <Card className="metric-card metric-card--cyan">
                    <Statistic prefix={<SearchOutlined />} title="Уникальные запросы" value={data.length} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--blue">
                    <Statistic title="Всего неуспешных поисков" value={totalSearches} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--lime">
                    <Statistic title="Повторяются чаще 1 раза" value={repeatedSignals} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--blue">
                    <Statistic title="Последний сигнал" value={latest ? dayjs(latest).format("DD.MM HH:mm") : "—"} loading={isLoading} />
                </Card>
            </Space>

            <Card className="admin-table-card">
                <Alert
                    type="warning"
                    showIcon
                    message="Приоритет для контента"
                    description="Сначала разберите запросы с оранжевым счётчиком и свежей датой — это самые заметные пробелы в каталоге или поисковых синонимах."
                    style={{marginBottom: 16}}
                />
                <Table<SearchZeroResultItem>
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={sortedData}
                    scroll={{x: 720}}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Пока нет поисковых запросов без результата. Когда покупатели не найдут товар, сигналы появятся здесь."
                            />
                        )
                    }}
                />
            </Card>
        </Space>
    )
}

export default SearchZeroResultsPage
