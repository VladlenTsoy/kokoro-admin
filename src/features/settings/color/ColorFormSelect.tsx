import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Select, Space, Typography} from "antd"
import {useGetColorsQuery} from "./colorApi"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    optionColor: {
        display: "flex",
        alignItems: "center",
        gap: 8
    },
    color: {
        height: 20,
        width: 20,
        borderRadius: 50,
        boxShadow: token.boxShadowTertiary
    }
}))

const ColorFormSelect = () => {
    const {isError, isFetching, isLoading, data: colors, refetch} = useGetColorsQuery()
    const {styles} = useStyles()
    const hasLoadedColors = (colors?.length ?? 0) > 0

    return (
        <>
            <Form.Item
                label="Цвет"
                name="color_id"
                rules={[{required: true, message: "Выберите цвет"}]}
                extra="Цвет влияет на SKU, подбор фото, фильтры витрины и сборку заказа."
            >
                <Select
                    showSearch
                    loading={isLoading || isFetching}
                    placeholder={isError ? "Не удалось загрузить цвета" : "Выберите цвет"}
                    optionFilterProp="searchText"
                    disabled={isError && !hasLoadedColors}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Цвета не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте палитру перед созданием SKU и публикацией карточки.
                            </Typography.Text>
                        </Space>
                    )}
                    options={colors?.map(c => ({
                        value: c.id,
                        label: (
                            <div className={styles.optionColor}>
                                <div className={styles.color} style={{ background: c.hex }} />
                                {c.title}
                            </div>
                        ),
                        searchText: c.title
                    }))}
                />
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Палитра цветов временно недоступна"
                    description="Не создавайте SKU вслепую: без актуального цвета менеджер может ошибиться в фото, фильтрах витрины или сборке заказа. Повторите загрузку или проверьте настройки цветов."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isFetching && !isError && !hasLoadedColors && (
                <Alert
                    type="info"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Палитра цветов ещё не настроена"
                    description="Добавьте цвета в настройках каталога, чтобы менеджеры могли создавать варианты товара, связывать фото и фильтры без ручных обходов."
                />
            )}
        </>
    )
}

export default ColorFormSelect