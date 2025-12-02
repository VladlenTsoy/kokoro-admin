import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import "antd/dist/reset.css"
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
                    borderRadius: 12,
                    colorText: "#363A42",
                    colorTextSecondary: "#B0B3B9",
                    borderRadiusLG: 12,
                    colorBorder: "#F1F2F4",
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
                    },
                    Button: {
                        primaryColor: "#363A42",
                    },
                    Form: {
                        verticalLabelPadding: "0"
                    },
                    Switch: {
                        handleBg: "#363A42"
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
