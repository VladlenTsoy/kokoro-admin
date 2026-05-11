import {CopyOutlined} from "@ant-design/icons"
import {Alert, Button, Card, Descriptions, List, Space, Tag, Typography, message} from "antd"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const callbackPath = "/api/payme"

const PaymentsPage = () => {
    const {hostname, protocol} = window.location
    const callbackUrl = `${window.location.origin}${callbackPath}`
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)
    const isHttpsCallback = protocol === "https:"
    const readinessItems = [
        {
            title: "Callback использует HTTPS",
            description: isHttpsCallback
                ? "Адрес подходит для боевого кабинета Payme."
                : "Для production Payme нужен HTTPS-домен; локальный или HTTP-адрес используйте только для разработки.",
            ok: isHttpsCallback
        },
        {
            title: "Домен похож на рабочее окружение",
            description: isLocalHost
                ? "Сейчас открыт локальный адрес — не переносите его в боевой Payme Business."
                : "Проверьте, что это публичный домен нужного магазина перед копированием.",
            ok: !isLocalHost
        },
        {
            title: `Путь callback: ${callbackPath}`,
            description: "Скопируйте адрес без ручного изменения пути, чтобы платежные уведомления попадали в API.",
            ok: true
        }
    ]
    const hasReadinessWarning = readinessItems.some((item) => !item.ok)

    const copyCallback = async () => {
        try {
            await navigator.clipboard.writeText(callbackUrl)
            message.success("Callback URL скопирован")
        } catch {
            message.error("Не удалось скопировать URL. Скопируйте адрес вручную")
        }
    }

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <SettingsTableSection
                title="Платежи"
                subtitle="Безопасная настройка Payme callback и контроль статусов оплаты в заказах."
                addButtonText="Скопировать callback URL"
                addButtonIcon={<CopyOutlined />}
                onAdd={copyCallback}
            >
                <Alert
                    showIcon
                    type="info"
                    message="Перед включением платежей проверьте окружение и callback"
                    description="Эта страница не меняет настройки мерчанта автоматически. Скопируйте URL, внесите его в Payme Business и проверьте тестовый заказ до запуска продаж."
                />

                <Card>
                    <Space direction="vertical" size={16} style={{width: "100%"}}>
                        <Space wrap align="center">
                            <Typography.Title level={5} style={{margin: 0}}>
                                Payme callback
                            </Typography.Title>
                            <Tag color="blue">Требует настройки в Payme Business</Tag>
                        </Space>

                        <Typography.Text copyable>{callbackUrl}</Typography.Text>

                        <Descriptions column={{xs: 1, sm: 1, md: 2}} size="small" bordered>
                            <Descriptions.Item label="Что скопировать">Callback URL</Descriptions.Item>
                            <Descriptions.Item label="Где указать">Кабинет Payme Business</Descriptions.Item>
                            <Descriptions.Item label="После настройки">Проверить оплату тестовым заказом</Descriptions.Item>
                            <Descriptions.Item label="Если ошибка">Сверить домен, протокол HTTPS и путь {callbackPath}</Descriptions.Item>
                        </Descriptions>

                        <Alert
                            showIcon
                            type={hasReadinessWarning ? "warning" : "success"}
                            message={hasReadinessWarning ? "Перед копированием проверьте окружение" : "Callback выглядит готовым к настройке"}
                            description={hasReadinessWarning
                                ? "Страница открыта не как боевой HTTPS-домен. Это нормально для разработки, но такой адрес нельзя переносить в production-мерчант."
                                : "Перед включением продаж всё равно выполните тестовый заказ и проверьте статус оплаты в админке."}
                        />

                        <List
                            size="small"
                            dataSource={readinessItems}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={(
                                            <Space wrap>
                                                <Tag color={item.ok ? "green" : "orange"}>{item.ok ? "OK" : "Проверить"}</Tag>
                                                <Typography.Text strong>{item.title}</Typography.Text>
                                            </Space>
                                        )}
                                        description={item.description}
                                    />
                                </List.Item>
                            )}
                        />

                        <Alert
                            showIcon
                            type="warning"
                            message="Не меняйте production-мерчант без подтверждения владельца"
                            description="Ошибочный callback может остановить подтверждение оплат. Для боевого изменения нужен отдельный контрольный тест и approval Владлена."
                        />

                        <Button type="primary" icon={<CopyOutlined />} onClick={copyCallback}>
                            Скопировать callback URL
                        </Button>
                    </Space>
                </Card>
            </SettingsTableSection>
        </Space>
    )
}

export default PaymentsPage
