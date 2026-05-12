import React from "react"
import {Alert, Button, Select, Space, Typography} from "antd"
import {ReloadOutlined} from "@ant-design/icons"
import {useGetSalesPointsQuery} from "../../../../settings/sales-point/salesPointApi.ts"

interface Props {
    value: number[]
    onChange: (salesPointIds: number[]) => void
}

const ProductHeaderSalesPointFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isError, isFetching, isLoading, refetch} = useGetSalesPointsQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const hasSalesPoints = Boolean(data?.length)

    return (
        <div style={{marginBottom: 16}}>
            <Space direction="vertical" size={8} style={{width: "100%"}}>
                <Typography.Title level={5} style={{marginBottom: 0}}>Точки продаж</Typography.Title>
                <Select<number[]>
                    mode="multiple"
                    style={{width: "100%"}}
                    placeholder={isError ? "Точки продаж не загрузились" : "Фильтр по точкам продаж"}
                    loading={isLoading || isFetching}
                    value={value}
                    onChange={onChange}
                    optionFilterProp="label"
                    allowClear
                    showSearch
                    disabled={isError || (!isLoading && !isFetching && !hasSalesPoints)}
                    notFoundContent="Точки продаж не найдены"
                >
                    {data?.map((salesPoint) => (
                        <Select.Option key={salesPoint.id} value={salesPoint.id} label={salesPoint.title}>
                            {salesPoint.title}
                        </Select.Option>
                    ))}
                </Select>
                {isError && (
                    <Alert
                        showIcon
                        type="warning"
                        message="Фильтр по точкам продаж недоступен"
                        description="Показываем общий каталог. Повторите загрузку перед проверкой выдачи или витрин, чтобы не пропустить товары нужной точки продаж."
                        action={(
                            <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                                Повторить
                            </Button>
                        )}
                    />
                )}
                {!isLoading && !isFetching && !isError && !hasSalesPoints && (
                    <Alert
                        showIcon
                        type="info"
                        message="Точки продаж ещё не настроены"
                        description="Фильтр появится после создания магазинов, шоурумов или пунктов выдачи в настройках. Сейчас каталог не ограничен точкой продаж."
                    />
                )}
            </Space>
        </div>
    )
}

export default ProductHeaderSalesPointFilter
