import React from "react"
import {BrowserRouter, Route, Routes} from "react-router-dom"
import Layout from "./layouts/Layout"
import HomePage from "./pages/HomePage"
import Products from "./pages/Products"
import "antd/dist/reset.css"

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products/:status" element={<Products />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    )
}

export default App
