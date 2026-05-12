import {useState} from "react"
import {Alert, Button, Card, Empty, Input, Space, Statistic, Switch, Table, Tag, Typography} from "antd"
import {ReloadOutlined, SearchOutlined} from "@ant-design/icons"
import type {ColumnsType} from "antd/es/table"
import {useNavigate} from "react-router-dom"
import dayjs from "dayjs"
import PageHeading from "../components/PageHeading.tsx"
import {type SearchZeroResultItem, useGetSearchZeroResultsQuery} from "../features/search-zero-results/searchZeroResultApi.ts"

const SearchZeroResultsPage = () => {
    const navigate = useNavigate()
    const {data = [], isLoading, isFetching, error, refetch} = useGetSearchZeroResultsQuery()
    const [queryFilter, setQueryFilter] = useState("")
    const [showRepeatedOnly, setShowRepeatedOnly] = useState(false)
    const [showFreshOnly, setShowFreshOnly] = useState(false)
    const sortedData = [...data].sort((a, b) => dayjs(b.lastSearchedAt).valueOf() - dayjs(a.lastSearchedAt).valueOf())
    const normalizedQueryFilter = queryFilter.trim().toLowerCase()
    const isFreshSignal = (item: SearchZeroResultItem) => dayjs().diff(dayjs(item.lastSearchedAt), "day") <= 7
    const isRepeatedSignal = (item: SearchZeroResultItem) => Number(item.count || 0) > 1
    const filteredData = sortedData.filter((item) => {
        const matchesQuery = normalizedQueryFilter ? item.query.toLowerCase().includes(normalizedQueryFilter) : true
        const matchesRepeat = showRepeatedOnly ? isRepeatedSignal(item) : true
        const matchesFreshness = showFreshOnly ? isFreshSignal(item) : true

        return matchesQuery && matchesRepeat && matchesFreshness
    })
    const totalSearches = sortedData.reduce((sum, item) => sum + Number(item.count || 0), 0)
    const latest = sortedData[0]?.lastSearchedAt
    const repeatedSignals = sortedData.filter(isRepeatedSignal).length
    const freshSignals = sortedData.filter(isFreshSignal).length
    const prioritySignals = sortedData.filter((item) => isRepeatedSignal(item) && isFreshSignal(item)).length
    const hasActiveFilters = Boolean(normalizedQueryFilter) || showRepeatedOnly || showFreshOnly
    const openCatalogSearch = (query: string) => {
        const params = new URLSearchParams({search: query.trim(), current: "1"})
        navigate(`/products?${params.toString()}`)
    }
    const resetFilters = () => {
        setQueryFilter("")
        setShowRepeatedOnly(false)
        setShowFreshOnly(false)
    }

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
        },
        {
            title: "Приоритет",
            key: "priority",
            width: 170,
            render: (_, item) => {
                if (isRepeatedSignal(item) && isFreshSignal(item)) {
                    return <Tag color="red">Разобрать сегодня</Tag>
                }
                if (isRepeatedSignal(item)) {
                    return <Tag color="orange">Повторяется</Tag>
                }
                if (isFreshSignal(item)) {
                    return <Tag color="green">Свежий</Tag>
                }

                return <Tag>Низкий</Tag>
            }
        },
        {
            title: "Действие",
            key: "action",
            width: 190,
            render: (_, item) => (
                <Button size="small" icon={<SearchOutlined />} onClick={() => openCatalogSearch(item.query)}>
                    Проверить каталог
                </Button>
            )
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
                    description="Проверьте повторяющиеся запросы: их стоит добавить в названия, теги, синонимы или карточки товара. Кнопка в строке сразу откроет каталог с этим запросом, чтобы менеджер не перепечатывал текст вручную."
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
                <Card className="metric-card metric-card--cyan">
                    <Statistic title="Свежие за 7 дней" value={freshSignals} loading={isLoading} />
                </Card>
                <Card className="metric-card metric-card--blue">
                    <Statistic title="Разобрать сегодня" value={prioritySignals} loading={isLoading} />
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
                    description="Сначала разберите запросы с оранжевым счётчиком и свежей датой, затем нажмите «Проверить каталог» — так быстрее отличить реальный пробел от слишком узкой выдачи."
                    style={{marginBottom: 16}}
                />
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Space size={12} wrap style={{width: "100%"}}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Найти запрос, тег или артикул"
                            value={queryFilter}
                            onChange={(event) => setQueryFilter(event.target.value)}
                            style={{maxWidth: 360}}
                        />
                        <Space>
                            <Switch checked={showRepeatedOnly} onChange={setShowRepeatedOnly} />
                            <Typography.Text>Только повторные сигналы</Typography.Text>
                        </Space>
                        <Space>
                            <Switch checked={showFreshOnly} onChange={setShowFreshOnly} />
                            <Typography.Text>Только свежие за 7 дней</Typography.Text>
                        </Space>
                        {hasActiveFilters ? (
                            <Button onClick={resetFilters}>Сбросить фильтры</Button>
                        ) : null}
                    </Space>
                    <Typography.Text type="secondary">
                        Показано {filteredData.length} из {sortedData.length}. Метка «Разобрать сегодня» объединяет свежие и повторные запросы — это самый быстрый список для контент-правок.
                    </Typography.Text>
                    <Table<SearchZeroResultItem>
                        rowKey="id"
                        loading={isLoading}
                        columns={columns}
                        dataSource={filteredData}
                        scroll={{x: 860}}
                        pagination={{pageSize: 20, showSizeChanger: true}}
                        locale={{
                            emptyText: hasActiveFilters ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="По выбранным фильтрам сигналов нет. Сбросьте поиск, повторные или свежие сигналы, прежде чем заводить новую задачу на каталог."
                                >
                                    <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                </Empty>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Пока нет поисковых запросов без результата. Когда покупатели не найдут товар, сигналы появятся здесь."
                                />
                            )
                        }}
                    />
                </Space>
            </Card>
        </Space>
    )
}

export default SearchZeroResultsPage
