import {Button, Tooltip} from "antd"
import {SettingOutlined} from "@ant-design/icons"
import {useLocation, useNavigate} from "react-router-dom"
import {useCanAny} from "../../features/auth/permissions.ts"

const HeaderSettingsButton = () => {
    const navigate = useNavigate()
    const {pathname} = useLocation()
    const isSettingsPage = pathname.startsWith("/settings")
    const canOpenSettings = useCanAny(["settings.read", "catalog.read", "marketing.read", "staff.read"])

    if (!canOpenSettings) {
        return null
    }

    return (
        <Tooltip title="Настройки">
            <Button
                size="large"
                shape="circle"
                type={isSettingsPage ? "primary" : "default"}
                aria-label="Открыть настройки админки"
                title="Открыть настройки админки"
                icon={<SettingOutlined />}
                onClick={() => navigate("/settings")}
            />
        </Tooltip>
    )
}

export default HeaderSettingsButton
