import {Button, Card, Space, Typography, message} from "antd"
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
                    <Typography.Title level={5}>Payme callback</Typography.Title>
                    <Typography.Text copyable>{callbackUrl}</Typography.Text>
                    <Typography.Paragraph type="secondary" style={{marginTop: 12}}>
                        Для Payme Business укажите этот URL в настройках мерчанта.
                    </Typography.Paragraph>
                    <Button onClick={copyCallback}>Скопировать</Button>
                </Card>
            </SettingsTableSection>
        </Space>
    )
}

export default PaymentsPage
