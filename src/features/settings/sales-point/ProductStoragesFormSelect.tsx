import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Select, Space, Typography} from "antd"
import React from "react"
import {useGetSalesPointsWithStoragesQuery} from "./salesPointApi.ts"

const {OptGroup, Option} = Select

const ProductStoragesFormSelect: React.FC = () => {
    const {data, isError, isFetching, isLoading, refetch} = useGetSalesPointsWithStoragesQuery()
    const hasLoadedStorages = data?.some(salesPoint => (salesPoint.product_storages?.length ?? 0) > 0) ?? false

    return (
        <>
            <Form.Item
                label="Место хранения"
                name="storage_id"
                extra="Место хранения помогает менеджеру правильно разнести остатки и подготовить выдачу заказа."
            >
                <Select
                    showSearch
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить места хранения" : "Добавить место хранения"}
                    optionFilterProp="label"
                    disabled={isError && !hasLoadedStorages}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Места хранения не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте склад или точку выдачи перед заполнением остатков товара.
                            </Typography.Text>
                        </Space>
                    )}
                >
                    {data?.map(salesPoint => (
                        <OptGroup key={salesPoint.id} label={salesPoint.title}>
                            {salesPoint.product_storages?.map(storage => (
                                <Option
                                    value={storage.id}
                                    key={`storage-${storage.id}`}
                                    label={storage.title}
                                >
                                    {storage.title}
                                </Option>
                            ))}
                        </OptGroup>
                    ))}
                </Select>
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Места хранения временно недоступны"
                    description="Не заполняйте остатки вслепую: без подтверждённого склада или точки выдачи можно ошибиться в наличии и сборке заказа. Повторите загрузку или проверьте настройки хранения."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isFetching && !isError && !hasLoadedStorages && (
                <Alert
                    type="info"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Места хранения ещё не настроены"
                    description="Добавьте склады или точки выдачи в настройках, чтобы менеджеры могли назначать остатки без ручных обходов."
                />
            )}
        </>
    )
}
export default React.memo(ProductStoragesFormSelect)
