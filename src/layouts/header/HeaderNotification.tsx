import {Badge, Button, Popover, Space, Typography} from "antd"
import {BellOutlined, ClockCircleOutlined} from "@ant-design/icons"
import {useNavigate} from "react-router-dom"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"

const HeaderNotification = () => {
    const navigate = useNavigate()
    const {employee} = useSelectedAuthData()
    const shortcuts = [
        {
            label: "Проверить новые заказы",
            path: "/orders?deliveryStatus=pending",
            permission: "orders.read" as const
        },
        {
            label: "Проверить оплаты",
            path: "/settings/payments",
            permission: "settings.read" as const
        },
        {
            label: "Проверить интеграции",
            path: "/settings/integrations",
            permission: "integrations.read" as const
        },
        {
            label: "Настроить правила уведомлений",
            path: "/settings/notifications",
            permission: "settings.read" as const
        }
    ].filter((shortcut) => can(employee?.permissions, shortcut.permission))

    const notificationContent = (
        <Space direction="vertical" size={10} style={{maxWidth: 300}}>
            <Typography.Text strong>Уведомления пока не подключены</Typography.Text>
            <Typography.Text type="secondary">
                Здесь появятся срочные события по заказам, оплатам и интеграциям. Пока центр не активен, используйте
                быстрые проверки рабочих разделов.
            </Typography.Text>
            {shortcuts.length > 0 ? (
                <Space direction="vertical" size={6} style={{width: "100%"}}>
                    {shortcuts.map((shortcut) => (
                        <Button
                            key={shortcut.path}
                            type="link"
                            size="small"
                            style={{height: "auto", padding: 0, textAlign: "left", whiteSpace: "normal"}}
                            onClick={() => navigate(shortcut.path)}
                        >
                            {shortcut.label}
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
