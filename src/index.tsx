import React from "react"
import ReactDOM from "react-dom"
import reportWebVitals from "./reportWebVitals"
import App from "./App"
import {Provider} from "react-redux"
import {store} from "./store"
import {locale} from "moment"
import "moment/locale/ru"
import {ConfigProvider} from "antd"
import ruRU from "antd/es/locale/ru_RU"
import "antd/dist/reset.css"

locale("ru")

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <ConfigProvider locale={ruRU}>
                <App />
            </ConfigProvider>
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
)
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
