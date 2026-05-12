import {useState} from "react"
import {Alert, Badge, Button, Popover, Space, Tag, Typography} from "antd"
import {BellOutlined, ClockCircleOutlined} from "@ant-design/icons"
import {useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"

const HeaderNotification = () => {
    const navigate = useNavigate()
    const {employee} = useSelectedAuthData()
    const [isOpen, setIsOpen] = useState(false)
    const shortcuts = [
        {
            label: "Новые заказы",
            description: "Очередь, где менеджеру нужно взять заказ в работу.",
            tag: "Заказы",
            path: "/orders?deliveryStatus=pending",
            permission: "orders.read" as const
        },
        {
            label: "Оплаты и callback",
            description: "Проверить Payme URL и статусы перед продажами.",
            tag: "Оплаты",
            path: "/settings/payments",
            permission: "settings.read" as const
        },
        {
            label: "Интеграции с вниманием",
            description: "Открыть Datra/провайдеры и причины, требующие проверки.",
            tag: "Интеграции",
            path: "/settings/integrations",
            permission: "integrations.read" as const
        },
        {
            label: "Правила уведомлений",
            description: "Проверить, что клиенту/команде уйдут нужные сообщения.",
            tag: "Коммуникации",
            path: "/settings/notifications",
            permission: "settings.read" as const
        }
    ].filter((shortcut) => can(employee?.permissions, shortcut.permission))

    const openShortcut = (path: string) => {
        setIsOpen(false)
        navigate(path)
    }

    const notificationContent = (
        <Space direction="vertical" size={12} style={{maxWidth: 360}}>
            <Alert
                showIcon
                type="info"
                message="Live-уведомления ещё не подключены"
                description="Это не означает, что новых событий нет. Используйте быстрые проверки ниже в начале смены и после спорных оплат/интеграций."
            />
            {shortcuts.length > 0 ? (
                <Space direction="vertical" size={8} style={{width: "100%"}}>
                    {shortcuts.map((shortcut) => (
                        <Button
                            key={shortcut.path}
                            block
                            type="default"
                            size="small"
                            style={{height: "auto", padding: "8px 10px", textAlign: "left", whiteSpace: "normal"}}
                            onClick={() => openShortcut(shortcut.path)}
                        >
                            <Space direction="vertical" size={2} style={{width: "100%"}}>
                                <Space size={6} wrap>
                                    <Tag color="blue" style={{marginInlineEnd: 0}}>{shortcut.tag}</Tag>
                                    <Typography.Text strong>{shortcut.label}</Typography.Text>
                                </Space>
                                <Typography.Text type="secondary">{shortcut.description}</Typography.Text>
                            </Space>
                        </Button>
                    ))}
                </Space>
            ) : (
                <Typography.Text type="secondary">
                    Нет доступных разделов для быстрой проверки — запросите нужные права у администратора.
                </Typography.Text>
            )}
        </Space>
    )

    return (
        <Popover
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger="click"
            placement="bottomRight"
            title={(
                <Space size={8}>
                    <ClockCircleOutlined />
                    <span>Центр уведомлений</span>
                </Space>
            )}
            content={notificationContent}
        >
            <Badge dot={false} size="small">
                <Button
                    size="large"
                    shape="circle"
                    type="default"
                    aria-label="Открыть центр уведомлений"
                    icon={<BellOutlined />}
                />
            </Badge>
        </Popover>
    )
}

export default HeaderNotification
