import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import "antd/dist/reset.css"
import StoreProvider from "./features/StoreProvider.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StoreProvider>
            <App />
        </StoreProvider>
    </StrictMode>
)
