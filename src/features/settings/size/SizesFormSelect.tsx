import React from "react"
import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Select, Space, Typography} from "antd"
import {useGetSizesQuery} from "./sizeApi"
import type {SelectProps} from "antd"

const {Option} = Select

export interface SizesFormSelectProps {
    onChange?: SelectProps<number[]>["onChange"]
}

const SizesFormSelect: React.FC<SizesFormSelectProps> = ({onChange}) => {
    const {data, isError, isFetching, isLoading, refetch} = useGetSizesQuery()
    const hasLoadedSizes = (data?.length ?? 0) > 0

    return (
        <>
            <Form.Item
                label="Размеры"
                name="size_ids"
                extra="Размеры нужны для SKU, остатков и корректной выдачи товара при сборке заказа."
                rules={[{required: true, message: "Выберите размер!"}]}
            >
                <Select
                    showSearch
                    mode="multiple"
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить размеры" : "Добавить размер"}
                    optionFilterProp="label"
                    onChange={onChange}
                    disabled={isError && !hasLoadedSizes}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Размеры не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте размерную сетку перед созданием SKU и остатков.
                            </Typography.Text>
                        </Space>
                    )}
                >
                    {data?.map(size => (
                        <Option
                            value={size.id}
                            key={`size-${size.id}`}
                            label={size.title}
                        >
                            {size.title}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Размеры временно недоступны"
                    description="Не создавайте SKU вслепую: без актуальной размерной сетки можно ошибиться в остатках и сборке заказа. Повторите загрузку или проверьте настройки размеров."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isFetching && !isError && !hasLoadedSizes && (
                <Alert
                    type="info"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Размерная сетка ещё не настроена"
                    description="Добавьте размеры в настройках каталога, чтобы менеджеры могли создавать варианты товара и контролировать остатки без ручных обходов."
                />
            )}
        </>
    )
}
export default React.memo<SizesFormSelectProps>(SizesFormSelect)
