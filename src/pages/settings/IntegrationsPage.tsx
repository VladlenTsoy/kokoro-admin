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

const billingLabel: Record<string, string> = {
    active: "Оплачено",
    locked: "Заблокировано",
    expired: "Оплата истекла",
    free: "Бесплатно"
}

const testHint: Record<string, string> = {
    billing_locked: "Сначала активируйте оплату, затем заполните endpoint и token.",
    not_configured: "Заполните endpoint, tenant/client id и API token, затем сохраните настройки.",
    available: "Проверьте соединение перед включением отправки данных.",
    enabled: "Интеграция включена. Если Datra недоступна, магазин продолжит работу без отправки событий.",
    healthy: "Последняя проверка успешна. Следите за ошибками и временем health-check.",
    paused: "Отправка поставлена на паузу. Включайте только после проверки причины паузы."
}

const DatraCard = ({integration}: {integration: IntegrationSetting}) => {
    const [form] = Form.useForm()
    const [updateIntegration, {isLoading: isUpdating}] = useUpdateIntegrationMutation()
    const [testIntegration, {isLoading: isTesting}] = useTestIntegrationMutation()
    const [api, contextHolder] = message.useMessage()

    const paid = integration.billingStatus === "active"
    const locked = integration.status === "billing_locked"
    const canTest = paid && integration.configured
    const checklistItems = [
        {label: "Оплата активна", done: paid},
        {label: "Endpoint и tenant/client id заполнены", done: integration.configured},
        {label: "API token сохранён", done: integration.hasSecret},
        {label: "Выбраны события для отправки", done: Boolean(integration.enabledScopes?.length)},
        {label: "Проверка соединения выполнена", done: integration.healthy}
    ]

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

                <Alert
                    type={integration.healthy ? "success" : locked ? "warning" : "info"}
                    showIcon
                    message={testHint[integration.status]}
                    description={integration.lastHealthCheckAt ? `Последняя проверка: ${new Date(integration.lastHealthCheckAt).toLocaleString("ru-RU")}` : "Проверка ещё не запускалась — выполните её после сохранения настроек."}
                />

                {locked && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Интеграция заблокирована биллингом"
                        description="Datra можно настроить и включить только после оплаты. Для тестового включения администратор может перевести billing status в active."
                    />
                )}

                <Card size="small" title="Чек-лист подключения" styles={{body: {paddingTop: 8}}}>
                    <List
                        size="small"
                        dataSource={checklistItems}
                        renderItem={(item) => (
                            <List.Item>
                                <Space>
                                    <Tag color={item.done ? "green" : "default"}>{item.done ? "Готово" : "Нужно"}</Tag>
                                    <Typography.Text>{item.label}</Typography.Text>
                                </Space>
                            </List.Item>
                        )}
                    />
                </Card>

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
                            <Form.Item name="billingStatus" label="Billing status" extra={`Текущий статус: ${billingLabel[integration.billingStatus] || integration.billingStatus}`}>
                                <Input placeholder="active / locked / expired" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="endpoint" label="Datra endpoint" extra={!paid ? "Поле станет доступно после активной оплаты." : "Проверьте, что endpoint относится к нужной среде Datra."}>
                                <Input placeholder="https://api.datra.uz" disabled={!paid} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="tenantId" label="Tenant / client id" extra="Помогает Datra связать события с правильным клиентом.">
                                <Input placeholder="Опционально" disabled={!paid} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="apiToken" label={integration.hasSecret ? "API token (сохранён, введите новый для замены)" : "API token"} extra="Токен не показывается после сохранения. Оставьте пустым, если менять его не нужно.">
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
                    <Button onClick={runTest} loading={isTesting} disabled={!canTest}>Проверить соединение</Button>
                    {!canTest && <Typography.Text type="secondary">Проверка доступна после оплаты и сохранения обязательных настроек.</Typography.Text>}
                </Space>

                {integration.lastError && <Alert type="error" showIcon message="Последняя ошибка" description={integration.lastError} />}
            </Space>
        </Card>
    )
}

const IntegrationsPage = () => {
    const {data, isLoading, isError, error} = useGetIntegrationsQuery()

    return (
        <Space orientation="vertical" size={18} style={{width: "100%"}}>
            <PageHeading
                title="Интеграции"
                subtitle="Платные и внешние подключения: Datra CDP, Meta/Facebook и будущие сервисы."
            />

            {isError && (
                <Alert
                    type="error"
                    showIcon
                    message="Не удалось загрузить интеграции"
                    description={getNestErrorMessage(error)}
                />
            )}

            <List
                loading={isLoading}
                dataSource={data || []}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Интеграции ещё не заведены. Добавьте Datra или другой провайдер на backend, затем настройте оплату, endpoint и токен здесь."
                        />
                    )
                }}
                renderItem={(integration) => (
                    <List.Item style={{display: "block"}}>
                        {integration.providerKey === "datra_cdp" ? (
                            <DatraCard integration={integration} />
                        ) : (
                            <Card title={integration.title} extra={<Tag color={statusColor[integration.status]}>{statusLabel[integration.status]}</Tag>}>
                                <Typography.Paragraph type="secondary" style={{marginBottom: 0}}>
                                    Настройки этого провайдера пока недоступны в админке. Проверьте статус подключения или добавьте форму настройки отдельной задачей.
                                </Typography.Paragraph>
                            </Card>
                        )}
                    </List.Item>
                )}
            />
        </Space>
    )
}

export default IntegrationsPage
