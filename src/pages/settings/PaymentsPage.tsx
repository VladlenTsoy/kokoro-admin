import {Alert, Button, Card, List, Space, Tag, Typography, message} from "antd"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const callbackPath = "/api/payme"

const PaymentsPage = () => {
    const callbackUrl = `${window.location.origin}${callbackPath}`

    const copyCallback = async () => {
        try {
            await navigator.clipboard.writeText(callbackUrl)
            message.success("Callback URL скопирован")
        } catch {
            message.error("Не удалось скопировать URL")
        }
    }

    return (
        <Space orientation="vertical" size={16} style={{width: "100%"}}>
            <SettingsTableSection
                title="Платежи"
                subtitle="Payme callback и текущие статусы оплаты в заказах."
                addButtonText="Скопировать callback URL"
                onAdd={copyCallback}
            >
                <Card>
                    <Space orientation="vertical" size={16} style={{width: "100%"}}>
                        <Alert
                            type="info"
                            showIcon
                            message="Callback нужен для автоматического обновления оплаты в заказах."
                            description="После изменения настроек Payme проверьте тестовый заказ: статус оплаты должен обновиться без ручного вмешательства менеджера."
                        />

                        <div>
                            <Space wrap align="center" style={{marginBottom: 8}}>
                                <Typography.Title level={5} style={{margin: 0}}>Payme callback</Typography.Title>
                                <Tag color="blue">для Payme Business</Tag>
                            </Space>
                            <Typography.Text copyable>{callbackUrl}</Typography.Text>
                            <Typography.Paragraph type="secondary" style={{marginTop: 12, marginBottom: 0}}>
                                Скопируйте URL и укажите его в настройках мерчанта Payme. Не меняйте домен без проверки API и заказов.
                            </Typography.Paragraph>
                        </div>

                        <List
                            size="small"
                            header={<Typography.Text strong>Чек-лист перед передачей в работу</Typography.Text>}
                            dataSource={[
                                "Callback URL сохранён в кабинете Payme без лишних пробелов.",
                                "Тестовый платёж меняет статус заказа в админке.",
                                "Менеджеру понятно, что делать при ошибке или зависшем статусе оплаты."
                            ]}
                            renderItem={(item) => <List.Item>{item}</List.Item>}
                        />

                        <Button onClick={copyCallback}>Скопировать callback URL</Button>
                    </Space>
                </Card>
            </SettingsTableSection>
        </Space>
    )
}

export default PaymentsPage
