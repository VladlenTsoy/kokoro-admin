import {useEffect, useMemo} from "react"
import {Alert, Button, Card, Checkbox, Col, Empty, Form, Input, List, Row, Select, Space, Statistic, Switch, Tag, Typography, message} from "antd"
import PageHeading from "../../components/PageHeading.tsx"
import {
    useGetIntegrationsQuery,
    useTestIntegrationMutation,
    useUpdateIntegrationMutation
} from "../../features/integrations/integrationApi.ts"
import type {IntegrationEventScope, IntegrationSetting} from "../../features/integrations/integrationTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"

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

const billingStatusOptions = [
    {value: "active", label: "Активен — можно проверять и включать"},
    {value: "locked", label: "Заблокирован — нет оплаты/доступа"},
    {value: "expired", label: "Истёк — нужен контакт с провайдером"},
    {value: "free", label: "Бесплатный режим"}
]

const providerLabel: Record<string, string> = {
    datra_cdp: "Datra CDP",
    meta: "Meta / Facebook"
}

const getProviderDisplayName = (integration: IntegrationSetting) => integration.title || providerLabel[integration.providerKey] || integration.providerKey

const getIntegrationAttentionReason = (integration: IntegrationSetting) => {
    if (integration.status === "billing_locked" || integration.billingStatus === "locked" || integration.billingStatus === "expired") {
        return "биллинг или доступ требуют проверки"
    }

    if (!integration.configured) {
        return "нет безопасно завершённой настройки"
    }

    if (integration.lastError) {
        return "есть последняя ошибка подключения"
    }

    if (integration.enabled && (!integration.healthy || integration.runtimeStatus === "error")) {
        return "включена, но health check не зелёный"
    }

    return null
}

const UnsupportedIntegrationCard = ({integration}: {integration: IntegrationSetting}) => (
    <Card
        title={
            <Space wrap>
                <span>{getProviderDisplayName(integration)}</span>
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

const DatraCard = ({integration, isListRefreshing}: {integration: IntegrationSetting; isListRefreshing: boolean}) => {
    const [form] = Form.useForm()
    const [updateIntegration, {isLoading: isUpdating}] = useUpdateIntegrationMutation()
    const [testIntegration, {isLoading: isTesting}] = useTestIntegrationMutation()
    const [api, contextHolder] = message.useMessage()

    const paid = integration.billingStatus === "active"
    const locked = integration.status === "billing_locked"
    const mutationInProgress = isUpdating || isTesting
    const controlsLocked = mutationInProgress || isListRefreshing
    const providerName = getProviderDisplayName(integration)
    const integrationContext = `${providerName}: статус ${statusLabel[integration.status] || integration.status}, биллинг ${integration.billingStatus}, ${integration.configured ? "настроена" : "не настроена"}`
    const toggleActionLabel = integration.enabled ? `Выключить интеграцию ${integrationContext}` : `Включить интеграцию ${integrationContext}`
    const saveActionLabel = `Сохранить настройки интеграции ${integrationContext}`
    const testActionLabel = `Проверить подключение интеграции ${integrationContext}`

    useEffect(() => {
        form.setFieldsValue({
            billingStatus: integration.billingStatus,
            endpoint: String(integration.publicConfig?.endpoint || "https://api.datra.uz"),
            tenantId: String(integration.publicConfig?.tenantId || ""),
            enabledScopes: integration.enabledScopes || [],
            apiToken: ""
        })
    }, [form, integration.billingStatus, integration.enabledScopes, integration.publicConfig?.endpoint, integration.publicConfig?.tenantId])

    const saveSettings = async () => {
        try {
            const values = await form.validateFields()

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
            if (isAntdFormValidationError(error)) {
                return
            }

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
            extra={(
                <Switch
                    checked={integration.enabled}
                    disabled={locked || !integration.configured || controlsLocked}
                    loading={isUpdating}
                    onChange={toggleEnabled}
                    aria-label={toggleActionLabel}
                    title={toggleActionLabel}
                />
            )}
        >
            {contextHolder}
            <Space direction="vertical" size={16} style={{width: "100%"}}>
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

                {isListRefreshing && (
                    <Alert
                        type="info"
                        showIcon
                        message="Обновляем состояние интеграции"
                        description="Дождитесь свежего ответа API перед сохранением, проверкой или включением Datra, чтобы не применить настройки поверх устаревшего статуса оплаты, токена или health check."
                    />
                )}

                {mutationInProgress && (
                    <Alert
                        type="info"
                        showIcon
                        message={isTesting ? "Проверяем Datra" : "Сохраняем настройки Datra"}
                        description="Поля и переключатели временно заблокированы, чтобы не смешать тест подключения, биллинг и замену токена в одном действии."
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
                            <Form.Item
                                name="billingStatus"
                                label="Статус оплаты Datra"
                                tooltip="Меняйте только после подтверждения оплаты или тестового доступа."
                            >
                                <Select options={billingStatusOptions} disabled={controlsLocked} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="endpoint"
                                label="Endpoint Datra"
                                extra="Оставьте стандартный адрес, если Datra не выдала отдельный API endpoint."
                            >
                                <Input placeholder="https://api.datra.uz" disabled={!paid || controlsLocked} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="tenantId"
                                label="Tenant / client ID"
                                extra="Публичный идентификатор клиента Datra. Не вставляйте сюда секретные ключи."
                            >
                                <Input placeholder="Например: kokoro-production" disabled={!paid || controlsLocked} autoComplete="off" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="apiToken"
                                label={integration.hasSecret ? "API token Datra (сохранён, введите новый только для замены)" : "API token Datra"}
                                extra="Токен не показывается после сохранения. Вводите новый только при плановой ротации или первичной настройке."
                            >
                                <Input.Password placeholder="Вставьте токен Datra" disabled={!paid || controlsLocked} autoComplete="new-password" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="enabledScopes" label="Что отправлять в Datra">
                        <Checkbox.Group style={{width: "100%"}} disabled={!paid || controlsLocked}>
                            <Row gutter={[12, 12]}>
                                {DATRA_SCOPES.map((scope) => (
                                    <Col xs={24} md={12} key={scope.value}>
                                        <Checkbox
                                            value={scope.value}
                                            disabled={scope.value === "promotions" || scope.value === "loyalty"}
                                            aria-label={`${providerName}: ${scope.label.toLowerCase()} — ${scope.description}${scope.value === "promotions" || scope.value === "loyalty" ? "; выключено для MVP" : ""}`}
                                            title={`${providerName}: ${scope.label} — ${scope.description}${scope.value === "promotions" || scope.value === "loyalty" ? "; выключено для MVP" : ""}`}
                                        >
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
                    <Button type="primary" onClick={saveSettings} loading={isUpdating} disabled={controlsLocked} aria-label={saveActionLabel} title={saveActionLabel}>Сохранить настройки</Button>
                    <Button onClick={runTest} loading={isTesting} disabled={!paid || controlsLocked} aria-label={testActionLabel} title={testActionLabel}>Проверить</Button>
                </Space>

                {integration.lastError && <Alert type="error" showIcon message="Последняя ошибка" description={integration.lastError} />}
            </Space>
        </Card>
    )
}

const IntegrationsPage = () => {
    const {data, isError, isFetching, isLoading, refetch} = useGetIntegrationsQuery()
    const integrations = useMemo(() => data || [], [data])

    const summary = useMemo(() => {
        return integrations.reduce(
            (acc, integration) => {
                acc.total += 1

                if (integration.enabled) acc.enabled += 1
                if (integration.configured) acc.configured += 1
                if (integration.healthy) acc.healthy += 1
                if (getIntegrationAttentionReason(integration)) acc.needsAttention += 1

                return acc
            },
            {total: 0, enabled: 0, configured: 0, healthy: 0, needsAttention: 0}
        )
    }, [integrations])

    const attentionIntegrations = useMemo(
        () => integrations
            .map((integration) => ({integration, reason: getIntegrationAttentionReason(integration)}))
            .filter((item): item is {integration: IntegrationSetting; reason: string} => Boolean(item.reason)),
        [integrations]
    )

    return (
        <Space direction="vertical" size={18} style={{width: "100%"}}>
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

            {!isError && integrations.length > 0 && (
                <>
                    <Row gutter={[12, 12]}>
                        <Col xs={12} md={6}>
                            <Card size="small"><Statistic title="Всего провайдеров" value={summary.total} loading={isLoading} /></Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small"><Statistic title="Включены" value={summary.enabled} loading={isLoading} /></Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small"><Statistic title="Настроены" value={summary.configured} loading={isLoading} /></Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small"><Statistic title="Требуют внимания" value={summary.needsAttention} loading={isLoading} valueStyle={{color: summary.needsAttention > 0 ? "#cf1322" : undefined}} /></Card>
                        </Col>
                    </Row>

                    {attentionIntegrations.length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Есть интеграции, которые лучше проверить до включения или кампаний"
                            description={
                                <Space direction="vertical" size={4}>
                                    {attentionIntegrations.map(({integration, reason}) => (
                                        <Typography.Text key={integration.id}>
                                            <Typography.Text strong>{getProviderDisplayName(integration)}</Typography.Text>: {reason}
                                        </Typography.Text>
                                    ))}
                                </Space>
                            }
                        />
                    )}
                </>
            )}

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
                    dataSource={integrations}
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
                            {integration.providerKey === "datra_cdp" ? <DatraCard integration={integration} isListRefreshing={isFetching && !isLoading} /> : <UnsupportedIntegrationCard integration={integration} />}
                        </List.Item>
                    )}
                />
            )}
        </Space>
    )
}

export default IntegrationsPage
