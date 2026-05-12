import React from "react"
import {Alert, Button, Select, Space, Typography} from "antd"
import {ReloadOutlined} from "@ant-design/icons"
import {useGetCollectionsQuery} from "../../../../settings/collection/collectionApi.ts"

interface Props {
    value: number[]
    onChange: (collectionIds: number[]) => void
}

const ProductHeaderCollectionFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isError, isFetching, isLoading, refetch} = useGetCollectionsQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const hasCollections = Boolean(data?.length)

    return (
        <div style={{marginBottom: 16}}>
            <Space direction="vertical" size={8} style={{width: "100%"}}>
                <Typography.Title level={5} style={{marginBottom: 0}}>Коллекции</Typography.Title>
                <Select<number[]>
                    mode="multiple"
                    style={{width: "100%"}}
                    placeholder={isError ? "Коллекции не загрузились" : "Фильтр по коллекциям"}
                    loading={isLoading || isFetching}
                    value={value}
                    onChange={onChange}
                    optionFilterProp="label"
                    allowClear
                    showSearch
                    disabled={isError || (!isLoading && !isFetching && !hasCollections)}
                    notFoundContent="Коллекции не найдены"
                >
                    {data?.map((collection) => (
                        <Select.Option key={collection.id} value={collection.id} label={collection.title}>
                            {collection.title}
                        </Select.Option>
                    ))}
                </Select>
                {isError && (
                    <Alert
                        showIcon
                        type="warning"
                        message="Фильтр по коллекциям недоступен"
                        description="Показываем общий каталог. Повторите загрузку перед промо-проверкой, чтобы не пропустить товары из нужной витринной коллекции."
                        action={(
                            <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                                Повторить
                            </Button>
                        )}
                    />
                )}
                {!isLoading && !isFetching && !isError && !hasCollections && (
                    <Alert
                        showIcon
                        type="info"
                        message="Коллекции ещё не настроены"
                        description="Фильтр появится после создания сезонных, промо или витринных коллекций в настройках. Сейчас список товаров не ограничен коллекциями."
                    />
                )}
            </Space>
        </div>
    )
}

export default ProductHeaderCollectionFilter
