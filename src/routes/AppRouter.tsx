import {BrowserRouter, Route, Routes} from "react-router-dom"
import {lazy, Suspense} from "react"
import PrivateLayout from "../layouts/PrivateLayout.tsx"
import Layout from "../layouts/Layout.tsx"
import CountriesPage from "../pages/settings/CountriesPage.tsx"
import SizePage from "../pages/settings/SizePage.tsx"
import SettingsLayout from "../layouts/SettingsLayout.tsx"
import ProductCategoryPage from "../pages/settings/ProductCategoryPage.tsx"
import SalesPointPage from "../pages/settings/SalesPointPage.tsx"
import SourcePage from "../pages/settings/SourcePage.tsx"
import ProductStoragePage from "../pages/settings/ProductStoragePage.tsx"
import ProductPage from "../pages/ProductPage.tsx"

export const Login = lazy(() => import("../pages/LoginPage.tsx"))
export const HomePage = lazy(() => import("../pages/HomePage.tsx"))
export const OrdersPage = lazy(() => import("../pages/OrdersPage.tsx"))
export const ProductsPage = lazy(() => import("../pages/ProductsPage.tsx"))
export const ClientsPage = lazy(() => import("../pages/ClientsPage.tsx"))
export const NotFound = lazy(() => import("../pages/NotFoundPage.tsx"))
export const ColorPage = lazy(() => import("../pages/settings/ColorPage.tsx"))
export const ProductVariantStatusPage = lazy(() => import("../pages/settings/ProductVariantStatusPage.tsx"))
export const ProductPropertyPage = lazy(() => import("../pages/settings/ProductPropertyPage.tsx"))

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<div>Загрузка...</div>}>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    <Route element={<PrivateLayout />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="orders" element={<OrdersPage />} />
                            <Route path="products" element={<ProductsPage />} />
                            <Route path="products/:id" element={<ProductsPage />} />
                            <Route path="products/product/create" element={<ProductPage />} />
                            <Route path="products/product/:id" element={<ProductPage />} />
                            <Route path="clients" element={<ClientsPage />} />
                            <Route path="/settings" element={<SettingsLayout />}>
                                <Route path="countries" element={<CountriesPage />} />
                                <Route path="colors" element={<ColorPage />} />
                                <Route path="sizes" element={<SizePage />} />
                                <Route path="product-categories" element={<ProductCategoryPage />} />
                                <Route path="sales-points" element={<SalesPointPage />} />
                                <Route path="product-storages" element={<ProductStoragePage />} />
                                <Route path="sources" element={<SourcePage />} />
                                <Route path="product-variant-statuses" element={<ProductVariantStatusPage />} />
                                <Route path="product-properties" element={<ProductPropertyPage />} />
                            </Route>
                        </Route>

                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
