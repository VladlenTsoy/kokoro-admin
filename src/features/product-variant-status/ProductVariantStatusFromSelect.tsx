import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Select, Space, Typography} from "antd"
import {useGetProductVariantStatusesQuery} from "./productVariantStatusApi.ts"

const ProductVariantStatusFromSelect = () => {
    const {data, isError, isFetching, isLoading, refetch} = useGetProductVariantStatusesQuery()
    const hasLoadedStatuses = (data?.length ?? 0) > 0

    return (
        <>
            <Form.Item
                label="Статус"
                name="status_id"
                extra="Статус SKU влияет на публикацию, фильтры каталога и готовность товара к продаже."
                rules={[{required: true, message: "Выберите статус!"}]}
            >
                <Select
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить статусы" : "Выберите статус SKU"}
                    optionFilterProp="label"
                    disabled={isError && !hasLoadedStatuses}
                    options={(data ?? []).map((item) => ({
                        value: item.id,
                        label: item.title
                    }))}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Статусы SKU не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте статусы в каталоге перед публикацией товаров.
                            </Typography.Text>
                        </Space>
                    )}
                />
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Статусы SKU временно недоступны"
                    description="Карточку товара лучше не публиковать, пока менеджер не видит актуальный жизненный цикл SKU. Повторите загрузку или проверьте настройки статусов."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isError && !hasLoadedStatuses && (
                <Alert
                    type="info"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Статусы SKU ещё не настроены"
                    description="Создайте статусы в настройках каталога, чтобы менеджеры могли отличать новые, активные, скрытые и архивные варианты перед продажами."
                />
            )}
        </>
    )
}

export default ProductVariantStatusFromSelect
