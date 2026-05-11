import {Alert, Button, Card, Descriptions, Space, Tag, Typography, message} from "antd"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const callbackPath = "/api/payme"

const PaymentsPage = () => {
    const callbackUrl = `${window.location.origin}${callbackPath}`

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
                            type="warning"
                            message="Не меняйте production-мерчант без подтверждения владельца"
                            description="Ошибочный callback может остановить подтверждение оплат. Для боевого изменения нужен отдельный контрольный тест и approval Владлена."
                        />

                        <Button type="primary" onClick={copyCallback}>
                            Скопировать callback URL
                        </Button>
                    </Space>
                </Card>
            </SettingsTableSection>
        </Space>
    )
}

export default PaymentsPage
