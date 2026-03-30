import {BulbOutlined, MoonOutlined} from "@ant-design/icons"
import {Button, Tooltip} from "antd"
import {toggleThemeMode, useSelectedTheme} from "../../features/theme/themeSlice.ts"
import {useDispatch} from "../../features/store.ts"

const HeaderThemeSwitch = () => {
    const dispatch = useDispatch()
    const mode = useSelectedTheme()
    const isDark = mode === "dark"

    return (
        <Tooltip title={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}>
            <Button
                size="large"
                shape="circle"
                type="default"
                icon={isDark ? <BulbOutlined /> : <MoonOutlined />}
                onClick={() => dispatch(toggleThemeMode())}
            />
        </Tooltip>
    )
}

export default HeaderThemeSwitch
