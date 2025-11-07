import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import "antd/dist/reset.css"
import "@ant-design/v5-patch-for-react-19"
import {ConfigProvider, theme} from "antd"
import StoreProvider from "./features/StoreProvider.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ConfigProvider
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    fontFamily: "Averta CY, sans-serif",
                    colorPrimary: "#B1E81C",
                    borderRadius: 12
                },
                components: {
                    Layout: {
                        headerBg: "#fff"
                    },
                    Segmented: {
                        itemSelectedBg: "#B1E81C",
                        // itemSelectedColor: "#fff",
                        // itemColor: "#fff",
                        trackBg: "#FAFAFB"
                    }
                }
            }}
        >
            <StoreProvider>
                <App />
            </StoreProvider>
        </ConfigProvider>
    </StrictMode>
)
