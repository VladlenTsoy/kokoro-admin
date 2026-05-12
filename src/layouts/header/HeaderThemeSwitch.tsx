import {BulbOutlined, MoonOutlined} from "@ant-design/icons"
import {Button, Tooltip} from "antd"
import {toggleThemeMode, useSelectedTheme} from "../../features/theme/themeSlice.ts"
import {useDispatch} from "../../features/store.ts"

const HeaderThemeSwitch = () => {
    const dispatch = useDispatch()
    const mode = useSelectedTheme()
    const isDark = mode === "dark"

    const label = isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"

    return (
        <Tooltip title={label}>
            <Button
                size="large"
                shape="circle"
                type="default"
                aria-label={label}
                title={label}
                icon={isDark ? <BulbOutlined /> : <MoonOutlined />}
                onClick={() => dispatch(toggleThemeMode())}
            />
        </Tooltip>
    )
}

export default HeaderThemeSwitch
