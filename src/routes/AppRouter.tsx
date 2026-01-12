import {BrowserRouter, Route, Routes} from "react-router-dom"
import {lazy, Suspense} from "react"
import PrivateLayout from "../layouts/PrivateLayout.tsx"
import Layout from "../layouts/Layout.tsx"
import SettingsLayout from "../layouts/SettingsLayout.tsx"

export const Login = lazy(() => import("../pages/LoginPage.tsx"))
export const HomePage = lazy(() => import("../pages/HomePage.tsx"))
export const OrdersPage = lazy(() => import("../pages/OrdersPage.tsx"))
export const ProductsPage = lazy(() => import("../pages/ProductsPage.tsx"))
export const ClientsPage = lazy(() => import("../pages/ClientsPage.tsx"))
export const NotFound = lazy(() => import("../pages/NotFoundPage.tsx"))
export const ColorPage = lazy(() => import("../pages/settings/ColorPage.tsx"))
export const ProductVariantStatusPage = lazy(() => import("../pages/settings/ProductVariantStatusPage.tsx"))
export const ProductPropertyPage = lazy(() => import("../pages/settings/ProductPropertyPage.tsx"))
export const ProductPage = lazy(() => import("../pages/ProductPage.tsx"))
export const ProductStoragePage = lazy(() => import("../pages/settings/ProductStoragePage.tsx"))
export const SourcePage = lazy(() => import("../pages/settings/SourcePage.tsx"))
export const SalesPointPage = lazy(() => import("../pages/settings/SalesPointPage.tsx"))
export const ProductCategoryPage = lazy(() => import("../pages/settings/ProductCategoryPage.tsx"))
export const SizePage = lazy(() => import("../pages/settings/SizePage.tsx"))
export const CountriesPage = lazy(() => import("../pages/settings/CountriesPage.tsx"))

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
                            <Route path="products/product/add-color/:variantId" element={<ProductPage />} />
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
