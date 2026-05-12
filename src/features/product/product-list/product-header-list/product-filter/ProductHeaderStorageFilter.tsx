import React from "react"
import {Alert, Button, Select, Space, Typography} from "antd"
import {ReloadOutlined} from "@ant-design/icons"
import {useGetStoragesQuery} from "../../../../settings/product-storage/productStorageApi.ts"

interface Props {
    value: number[]
    onChange: (storageIds: number[]) => void
}

const ProductHeaderStorageFilter: React.FC<Props> = ({value, onChange}) => {
    const {data, isError, isFetching, isLoading, refetch} = useGetStoragesQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const hasStorages = Boolean(data?.length)

    return (
        <div style={{marginBottom: 16}}>
            <Space direction="vertical" size={8} style={{width: "100%"}}>
                <Typography.Title level={5} style={{marginBottom: 0}}>Места хранения</Typography.Title>
                <Select<number[]>
                    mode="multiple"
                    style={{width: "100%"}}
                    placeholder={isError ? "Склады не загрузились" : "Фильтр по местам хранения"}
                    loading={isLoading || isFetching}
                    value={value}
                    onChange={onChange}
                    optionFilterProp="label"
                    allowClear
                    showSearch
                    disabled={isError || (!isLoading && !isFetching && !hasStorages)}
                    notFoundContent="Места хранения не найдены"
                >
                    {data?.map((storage) => (
                        <Select.Option key={storage.id} value={storage.id} label={storage.title}>
                            {storage.title}
                        </Select.Option>
                    ))}
                </Select>
                {isError && (
                    <Alert
                        showIcon
                        type="warning"
                        message="Фильтр по складам недоступен"
                        description="Показываем общий каталог. Повторите загрузку перед проверкой остатков, чтобы не пропустить товары на нужном месте хранения."
                        action={(
                            <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                                Повторить
                            </Button>
                        )}
                    />
                )}
                {!isLoading && !isFetching && !isError && !hasStorages && (
                    <Alert
                        showIcon
                        type="info"
                        message="Места хранения ещё не настроены"
                        description="Фильтр появится после создания складов или зон хранения в настройках. Сейчас каталог не ограничен складом."
                    />
                )}
            </Space>
        </div>
    )
}

export default ProductHeaderStorageFilter
