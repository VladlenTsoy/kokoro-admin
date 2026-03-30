import {Button, Tooltip} from "antd"
import {SettingOutlined} from "@ant-design/icons"
import {useLocation, useNavigate} from "react-router-dom"

const HeaderSettingsButton = () => {
    const navigate = useNavigate()
    const {pathname} = useLocation()
    const isSettingsPage = pathname.startsWith("/settings")

    return (
        <Tooltip title="Настройки">
            <Button
                size="large"
                shape="circle"
                type={isSettingsPage ? "primary" : "default"}
                icon={<SettingOutlined />}
                onClick={() => navigate("/settings")}
            />
        </Tooltip>
    )
}

export default HeaderSettingsButton
