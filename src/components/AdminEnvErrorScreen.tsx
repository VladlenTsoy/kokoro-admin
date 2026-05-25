import {Alert, Card, Space, Tag, Typography} from "antd"
import type {AdminEnvValidationResult} from "../utils/adminEnvValidation.ts"

const {Paragraph, Text, Title} = Typography

interface AdminEnvErrorScreenProps {
    validation: AdminEnvValidationResult
}

export const AdminEnvErrorScreen = ({validation}: AdminEnvErrorScreenProps) => {
    const requiredNames = validation.issues.map((issue) => issue.name)
    const uniqueRequiredNames = Array.from(new Set(requiredNames))
    const ownerCopy = `Админка не запущена: проверьте переменные ${uniqueRequiredNames.join(", ")} в окружении frontend. Значения не отправляйте в чат; обновите конфигурацию и перезапустите сборку/preview.`

    return (
        <main className="admin-env-error">
            <Card className="admin-env-error__card">
                <Space direction="vertical" size={18} style={{width: "100%"}}>
                    <Alert
                        showIcon
                        type="error"
                        message="Админка не может стартовать из-за настройки окружения"
                        description="API и CDN адреса не прошли безопасную проверку. Роутер и запросы остановлены, чтобы не показать пустой экран и не отправлять запросы на неверный адрес."
                    />

                    <Space direction="vertical" size={8}>
                        <Title level={3}>Что нужно проверить</Title>
                        <Paragraph>
                            Передайте ответственному за frontend окружение список переменных ниже. Значения переменных не отображаются и не нужны для диагностики в интерфейсе.
                        </Paragraph>
                    </Space>

                    <Space wrap>
                        {uniqueRequiredNames.map((name) => (
                            <Tag key={name} color="red">{name}</Tag>
                        ))}
                    </Space>

                    <Space direction="vertical" size={8}>
                        {validation.issues.map((issue) => (
                            <Text key={`${issue.name}-${issue.reason}`}>
                                <Text strong>{issue.name}</Text>: {issue.reason}
                            </Text>
                        ))}
                    </Space>

                    <Alert
                        showIcon
                        type="info"
                        message="Текст для владельца конфигурации"
                        description={<Text copyable={{text: ownerCopy}}>{ownerCopy}</Text>}
                    />
                </Space>
            </Card>
        </main>
    )
}
