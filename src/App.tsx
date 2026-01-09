import "./App.css"
import {AppRouter} from "./routes/AppRouter.tsx"
import {ConfigProvider, theme} from "antd"
import {themes} from "./utils/themes.ts"
import {useSelectedTheme} from "./features/theme/themeSlice.ts"

function App() {
    const mode = useSelectedTheme()

    return (
        <ConfigProvider
            theme={{
                algorithm: mode === "light" ? theme.defaultAlgorithm : theme.darkAlgorithm,
                token: themes[mode].token,
                components: themes[mode].components
            }}
        >
            <AppRouter />
        </ConfigProvider>
    )
}

export default App
