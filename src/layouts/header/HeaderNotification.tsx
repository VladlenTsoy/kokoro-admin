import {Badge, Button, Tooltip} from "antd"
import {BellOutlined} from "@ant-design/icons"

const HeaderNotification = () => {
    return (
        <Tooltip title="Уведомления">
            <Badge count={3} size="small">
                <Button
                    size="large"
                    shape="circle"
                    type="default"
                    icon={<BellOutlined />}
                />
            </Badge>
        </Tooltip>
    )
}

export default HeaderNotification
