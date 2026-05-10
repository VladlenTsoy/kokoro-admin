import {BrowserRouter, Navigate, Route, Routes, useLocation} from "react-router-dom"
import {lazy, Suspense} from "react"
import {Spin} from "antd"
import PrivateLayout from "../layouts/PrivateLayout.tsx"
import Layout from "../layouts/Layout.tsx"
import SettingsLayout from "../layouts/SettingsLayout.tsx"
import PermissionGuard from "../components/PermissionGuard.tsx"
import {useSelectedAuthData} from "../features/auth/authSlice.ts"
import {can} from "../features/auth/permissions.ts"
import type {PermissionCode} from "../features/auth/authTypes.ts"

export const Login = lazy(() => import("../pages/LoginPage.tsx"))
export const HomePage = lazy(() => import("../pages/HomePage.tsx"))
export const OrdersPage = lazy(() => import("../pages/OrdersPage.tsx"))
export const ProductsPage = lazy(() => import("../pages/ProductsPage.tsx"))
export const ClientsPage = lazy(() => import("../pages/ClientsPage.tsx"))
export const SearchZeroResultsPage = lazy(() => import("../pages/SearchZeroResultsPage.tsx"))
export const NotFound = lazy(() => import("../pages/NotFoundPage.tsx"))
export const ColorPage = lazy(() => import("../pages/settings/ColorPage.tsx"))
export const ProductVariantStatusPage = lazy(() => import("../pages/settings/ProductVariantStatusPage.tsx"))
export const ProductPropertyPage = lazy(() => import("../pages/settings/ProductPropertyPage.tsx"))
export const ProductTagsPage = lazy(() => import("../pages/settings/ProductTagsPage.tsx"))
export const ProductPage = lazy(() => import("../pages/ProductPage.tsx"))
export const ProductStoragePage = lazy(() => import("../pages/settings/ProductStoragePage.tsx"))
export const SourcePage = lazy(() => import("../pages/settings/SourcePage.tsx"))
export const SalesPointPage = lazy(() => import("../pages/settings/SalesPointPage.tsx"))
export const ProductCategoryPage = lazy(() => import("../pages/settings/ProductCategoryPage.tsx"))
export const SizePage = lazy(() => import("../pages/settings/SizePage.tsx"))
export const CountriesPage = lazy(() => import("../pages/settings/CountriesPage.tsx"))
export const CollectionsPage = lazy(() => import("../pages/settings/CollectionsPage.tsx"))
export const PromoCodesPage = lazy(() => import("../pages/settings/PromoCodesPage.tsx"))
export const OrderStatusesPage = lazy(() => import("../pages/settings/OrderStatusesPage.tsx"))
export const OrderNotificationsPage = lazy(() => import("../pages/settings/OrderNotificationsPage.tsx"))
export const PaymentsPage = lazy(() => import("../pages/settings/PaymentsPage.tsx"))
export const SettingsOverviewPage = lazy(() => import("../pages/settings/SettingsOverviewPage.tsx"))
export const IntegrationsPage = lazy(() => import("../pages/settings/IntegrationsPage.tsx"))
export const EmployeesPage = lazy(() => import("../pages/admin/EmployeesPage.tsx"))
export const RolesPage = lazy(() => import("../pages/admin/RolesPage.tsx"))
export const ForbiddenPage = lazy(() => import("../pages/errors/ForbiddenPage.tsx"))

const SETTINGS_INDEX_ITEMS: Array<{to: string; permission: PermissionCode}> = [
    {to: "overview", permission: "settings.read"},
    {to: "product-categories", permission: "catalog.read"},
    {to: "countries", permission: "settings.read"},
    {to: "promo-codes", permission: "marketing.read"},
    {to: "employees", permission: "staff.read"},
    {to: "integrations", permission: "integrations.read"}
]

const SettingsIndexRedirect = () => {
    const {employee} = useSelectedAuthData()
    const firstAvailable = SETTINGS_INDEX_ITEMS.find((item) => can(employee?.permissions, item.permission))

    return <Navigate to={firstAvailable?.to ?? "/forbidden"} replace />
}

const getRouteLoadingTip = (pathname: string) => {
    if (pathname.startsWith("/orders")) {
        return "Открываем заказы и статусы смены..."
    }

    if (pathname.startsWith("/products")) {
        return "Загружаем каталог и карточки товаров..."
    }

    if (pathname.startsWith("/clients")) {
        return "Готовим клиентскую базу..."
    }

    if (pathname.startsWith("/settings")) {
        return "Открываем настройки рабочего процесса..."
    }

    return "Загружаем рабочий экран..."
}

const RouteLoadingFallback = () => {
    const {pathname} = useLocation()

    return <Spin fullscreen tip={getRouteLoadingTip(pathname)} />
}

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/forbidden" element={<ForbiddenPage />} />

                    <Route element={<PrivateLayout />}>
                        <Route path="/" element={<Layout />}>
                            <Route element={<PermissionGuard permission="dashboard.read" />}>
                                <Route index element={<HomePage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="orders.read" />}>
                                <Route path="orders" element={<OrdersPage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="catalog.read" />}>
                                <Route path="products" element={<ProductsPage />} />
                                <Route path="products/:id" element={<ProductsPage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="catalog.create" />}>
                                <Route path="products/product/create" element={<ProductPage />} />
                                <Route path="products/product/add-color/:variantId" element={<ProductPage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="catalog.update" />}>
                                <Route path="products/product/:id" element={<ProductPage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="clients.read" />}>
                                <Route path="clients" element={<ClientsPage />} />
                            </Route>
                            <Route element={<PermissionGuard permission="catalog.read" />}>
                                <Route path="search-zero-results" element={<SearchZeroResultsPage />} />
                            </Route>
                            <Route path="/settings" element={<SettingsLayout />}>
                                <Route index element={<SettingsIndexRedirect />} />
                                <Route element={<PermissionGuard permission="settings.read" />}>
                                    <Route path="overview" element={<SettingsOverviewPage />} />
                                    <Route path="countries" element={<CountriesPage />} />
                                    <Route path="sales-points" element={<SalesPointPage />} />
                                    <Route path="product-storages" element={<ProductStoragePage />} />
                                    <Route path="sources" element={<SourcePage />} />
                                    <Route path="order-statuses" element={<OrderStatusesPage />} />
                                    <Route path="notifications" element={<OrderNotificationsPage />} />
                                    <Route path="payments" element={<PaymentsPage />} />
                                </Route>
                                <Route element={<PermissionGuard permission="catalog.read" />}>
                                    <Route path="colors" element={<ColorPage />} />
                                    <Route path="sizes" element={<SizePage />} />
                                    <Route path="product-categories" element={<ProductCategoryPage />} />
                                    <Route path="product-variant-statuses" element={<ProductVariantStatusPage />} />
                                    <Route path="product-properties" element={<ProductPropertyPage />} />
                                    <Route path="product-tags" element={<ProductTagsPage />} />
                                    <Route path="collections" element={<CollectionsPage />} />
                                </Route>
                                <Route element={<PermissionGuard permission="marketing.read" />}>
                                    <Route path="promo-codes" element={<PromoCodesPage />} />
                                </Route>
                                <Route element={<PermissionGuard permission="integrations.read" />}>
                                    <Route path="integrations" element={<IntegrationsPage />} />
                                </Route>
                                <Route element={<PermissionGuard permission="staff.read" />}>
                                    <Route path="employees" element={<EmployeesPage />} />
                                    <Route path="roles" element={<RolesPage />} />
                                </Route>
                            </Route>
                            <Route path="admin/employees" element={<Navigate to="/settings/employees" replace />} />
                            <Route path="admin/roles" element={<Navigate to="/settings/roles" replace />} />
                        </Route>

                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
