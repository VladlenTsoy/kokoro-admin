import {Badge, Button, Popover, Space, Typography} from "antd"
import {BellOutlined, ClockCircleOutlined} from "@ant-design/icons"

const HeaderNotification = () => {
    const notificationContent = (
        <Space direction="vertical" size={8} style={{maxWidth: 260}}>
            <Typography.Text strong>Уведомления пока не подключены</Typography.Text>
            <Typography.Text type="secondary">
                Здесь появятся срочные события по заказам, оплатам и интеграциям. Сейчас проверяйте их в разделах
                «Заказы» и «Настройки».
            </Typography.Text>
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
