import {Alert, Button, Card, Checkbox, Col, Empty, Form, Input, List, Row, Space, Switch, Tag, Typography, message} from "antd"
import PageHeading from "../../components/PageHeading.tsx"
import {
    useGetIntegrationsQuery,
    useTestIntegrationMutation,
    useUpdateIntegrationMutation
} from "../../features/integrations/integrationApi.ts"
import type {IntegrationEventScope, IntegrationSetting} from "../../features/integrations/integrationTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const DATRA_SCOPES: Array<{value: IntegrationEventScope; label: string; description: string}> = [
    {value: "customers", label: "Клиенты", description: "Профили клиентов и контакты"},
    {value: "devices", label: "Устройства", description: "Push tokens для будущего приложения"},
    {value: "products", label: "Товары", description: "Каталог и цены"},
    {value: "categories", label: "Категории", description: "Дерево/группы каталога"},
    {value: "branches", label: "Филиалы", description: "Точки продаж"},
    {value: "orders", label: "Заказы", description: "Создание и состав заказов"},
    {value: "order_statuses", label: "Статусы заказов", description: "Изменения lifecycle"},
    {value: "events", label: "События", description: "Web/app/admin события"},
    {value: "promotions", label: "Промо", description: "Выключено для MVP, включать отдельным этапом"},
    {value: "loyalty", label: "Лояльность", description: "Выключено для MVP, влияет на деньги"}
]

const statusColor: Record<string, string> = {
    billing_locked: "red",
    not_configured: "orange",
    available: "blue",
    enabled: "cyan",
    healthy: "green",
    paused: "gold"
}

const statusLabel: Record<string, string> = {
    billing_locked: "Не оплачено",
    not_configured: "Нужно настроить",
    available: "Доступно",
    enabled: "Включено",
    healthy: "Работает",
    paused: "Пауза"
}

const providerLabel: Record<string, string> = {
    datra_cdp: "Datra CDP",
    meta: "Meta / Facebook"
}

const UnsupportedIntegrationCard = ({integration}: {integration: IntegrationSetting}) => (
    <Card
        title={
            <Space wrap>
                <span>{integration.title || providerLabel[integration.providerKey] || integration.providerKey}</span>
                <Tag color="default">Скоро</Tag>
            </Space>
        }
    >
        <Alert
            type="info"
            showIcon
            message="Настройка пока недоступна в админке"
            description="Интеграция отображается в списке, но безопасного интерфейса управления ещё нет. Не включайте её вручную в production без согласованного процесса настройки и проверки."
        />
    </Card>
)

const DatraCard = ({integration}: {integration: IntegrationSetting}) => {
    const [form] = Form.useForm()
    const [updateIntegration, {isLoading: isUpdating}] = useUpdateIntegrationMutation()
    const [testIntegration, {isLoading: isTesting}] = useTestIntegrationMutation()
    const [api, contextHolder] = message.useMessage()

    const paid = integration.billingStatus === "active"
    const locked = integration.status === "billing_locked"

    const saveSettings = async () => {
        const values = await form.validateFields()
        try {
            await updateIntegration({
                providerKey: integration.providerKey,
                body: {
                    apiToken: values.apiToken || undefined,
                    enabledScopes: values.enabledScopes,
                    billingStatus: values.billingStatus,
                    publicConfig: {
                        tenantId: values.tenantId || undefined,
                        endpoint: values.endpoint || "https://api.datra.uz"
                    }
                }
            }).unwrap()
            api.success("Настройки интеграции сохранены")
            form.setFieldValue("apiToken", "")
        } catch (error) {
            api.error(getNestErrorMessage(error))
        }
    }

    const toggleEnabled = async (enabled: boolean) => {
        try {
            await updateIntegration({providerKey: integration.providerKey, body: {enabled}}).unwrap()
            api.success(enabled ? "Datra включена" : "Datra выключена")
        } catch (error) {
            api.error(getNestErrorMessage(error))
        }
    }

    const runTest = async () => {
        try {
            await testIntegration(integration.providerKey).unwrap()
            api.success("Проверка выполнена")
        } catch (error) {
            api.error(getNestErrorMessage(error))
        }
    }

    return (
        <Card
            title={<Space><span>{integration.title}</span><Tag color={statusColor[integration.status]}>{statusLabel[integration.status]}</Tag></Space>}
            extra={<Switch checked={integration.enabled} disabled={locked || !integration.configured} loading={isUpdating} onChange={toggleEnabled} />}
        >
            {contextHolder}
            <Space orientation="vertical" size={16} style={{width: "100%"}}>
                <Typography.Paragraph type="secondary" style={{marginBottom: 0}}>
                    Datra подключается как платная CDP-интеграция. Основной магазин продолжает работать даже если интеграция выключена или Datra недоступна.
                </Typography.Paragraph>

                {locked && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Интеграция заблокирована биллингом"
                        description="Datra можно настроить и включить только после оплаты. Для тестового включения администратор может перевести billing status в active."
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        billingStatus: integration.billingStatus,
                        endpoint: String(integration.publicConfig?.endpoint || "https://api.datra.uz"),
                        tenantId: String(integration.publicConfig?.tenantId || ""),
                        enabledScopes: integration.enabledScopes || []
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="billingStatus" label="Billing status">
                                <Input placeholder="active / locked / expired" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="endpoint" label="Datra endpoint">
                                <Input placeholder="https://api.datra.uz" disabled={!paid} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="tenantId" label="Tenant / client id">
                                <Input placeholder="Опционально" disabled={!paid} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="apiToken" label={integration.hasSecret ? "API token (сохранён, введите новый для замены)" : "API token"}>
                                <Input.Password placeholder="Bearer token Datra" disabled={!paid} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="enabledScopes" label="Что отправлять в Datra">
                        <Checkbox.Group style={{width: "100%"}} disabled={!paid}>
                            <Row gutter={[12, 12]}>
                                {DATRA_SCOPES.map((scope) => (
                                    <Col xs={24} md={12} key={scope.value}>
                                        <Checkbox value={scope.value} disabled={scope.value === "promotions" || scope.value === "loyalty"}>
                                            <Space direction="vertical" size={0}>
                                                <span>{scope.label}</span>
                                                <Typography.Text type="secondary" style={{fontSize: 12}}>{scope.description}</Typography.Text>
                                            </Space>
                                        </Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>

                <Space wrap>
                    <Button type="primary" onClick={saveSettings} loading={isUpdating}>Сохранить настройки</Button>
                    <Button onClick={runTest} loading={isTesting} disabled={!paid}>Проверить</Button>
                </Space>

                {integration.lastError && <Alert type="error" showIcon message="Последняя ошибка" description={integration.lastError} />}
            </Space>
        </Card>
    )
}

const IntegrationsPage = () => {
    const {data, isError, isFetching, isLoading, refetch} = useGetIntegrationsQuery()

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Интеграции"
                subtitle="Платные и внешние подключения: Datra CDP, Meta/Facebook и будущие сервисы."
            />

            <Alert
                type="info"
                showIcon
                message="Проверяйте интеграции как операционный чек-лист"
                description="Перед включением убедитесь, что биллинг активен, токен обновлён, нужные события выбраны, а тест подключения прошёл без ошибок. Production‑переключения и внешние ключи требуют согласованного доступа."
            />

            {isError ? (
                <Card>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Не удалось загрузить список интеграций"
                    >
                        <Space direction="vertical" size={8}>
                            <Typography.Text type="secondary">
                                Проверьте доступ к API или повторите загрузку. До восстановления списка не меняйте внешние подключения вручную.
                            </Typography.Text>
                            <Button onClick={() => refetch()} loading={isFetching}>Повторить загрузку</Button>
                        </Space>
                    </Empty>
                </Card>
            ) : (
                <List
                    loading={isLoading}
                    dataSource={data || []}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Интеграции ещё не заведены"
                            >
                                <Typography.Text type="secondary">
                                    Когда API вернёт доступные провайдеры, здесь появятся карточки настройки, статусы оплаты и проверки подключения.
                                </Typography.Text>
                            </Empty>
                        )
                    }}
                    renderItem={(integration) => (
                        <List.Item style={{display: "block"}}>
                            {integration.providerKey === "datra_cdp" ? <DatraCard integration={integration} /> : <UnsupportedIntegrationCard integration={integration} />}
                        </List.Item>
                    )}
                />
            )}
        </Space>
    )
}

export default IntegrationsPage
