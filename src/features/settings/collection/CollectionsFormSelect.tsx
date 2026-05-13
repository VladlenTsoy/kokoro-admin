import React from "react"
import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Select, Space, Typography, type SelectProps} from "antd"
import {useGetCollectionsQuery} from "./collectionApi.ts"

const {Option} = Select

export interface CollectionsFormSelectProps {
    onChange?: SelectProps<number[]>["onChange"]
}

const CollectionsFormSelect: React.FC<CollectionsFormSelectProps> = ({onChange}) => {
    const {data, isError, isFetching, isLoading, refetch} = useGetCollectionsQuery(undefined, {refetchOnMountOrArgChange: true})
    const hasLoadedCollections = (data?.length ?? 0) > 0

    return (
        <>
            <Form.Item
                label="Коллекции"
                name="collection_ids"
                extra="Коллекции влияют на витринные подборки, промо-блоки и быстрый поиск товара менеджером."
            >
                <Select
                    showSearch
                    mode="multiple"
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить коллекции" : "Выберите коллекции"}
                    optionFilterProp="label"
                    onChange={onChange}
                    allowClear
                    disabled={isError && !hasLoadedCollections}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Коллекции не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте витринные подборки перед привязкой товара к промо или сезонным разделам.
                            </Typography.Text>
                        </Space>
                    )}
                >
                    {data?.map((collection) => (
                        <Option
                            value={collection.id}
                            key={`collection-${collection.id}`}
                            label={collection.title}
                        >
                            {collection.title}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Коллекции временно недоступны"
                    description="Не привязывайте товар к подборкам вслепую: без актуального списка карточка может попасть не в тот промо-блок или исчезнуть из витринной навигации. Повторите загрузку перед сохранением."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isFetching && !isError && !hasLoadedCollections && (
                <Alert
                    type="info"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Коллекции ещё не настроены"
                    description="Добавьте коллекции в настройках витрины, чтобы менеджеры могли включать товар в сезонные подборки и промо-разделы без ручных обходов."
                />
            )}
        </>
    )
}

export default React.memo<CollectionsFormSelectProps>(CollectionsFormSelect)
