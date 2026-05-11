import {Alert, Button, Card, Col, Form, Input, Row, Space, Tag, Typography, message} from "antd"
import {useEffect, useState} from "react"
import {useLocation, useNavigate} from "react-router-dom"
import {useLoginMutation} from "../features/admin/authApi.ts"
import {useDispatch} from "../features/store.ts"
import {setAuthData, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {LockOutlined, SafetyOutlined, ThunderboltOutlined} from "@ant-design/icons"

interface LoginFormValues {
    email: string
    password: string
}

type LoginLocationState = {
    returnTo?: string
}

const getSafeReturnPath = (returnTo?: string) => {
    if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.startsWith("/login")) {
        return "/"
    }

    return returnTo
}

const RETURN_PAGE_LABELS: Array<{prefix: string; label: string}> = [
    {prefix: "/orders", label: "Заказы"},
    {prefix: "/clients", label: "Клиенты"},
    {prefix: "/products/product/create", label: "Создание товара"},
    {prefix: "/products/product", label: "Карточка товара"},
    {prefix: "/products", label: "Каталог товаров"},
    {prefix: "/search-zero-results", label: "Поисковые запросы без результатов"},
    {prefix: "/settings/employees", label: "Сотрудники"},
    {prefix: "/settings/roles", label: "Роли и доступы"},
    {prefix: "/settings/overview", label: "Готовность магазина"},
    {prefix: "/settings/product-categories", label: "Категории"},
    {prefix: "/settings/product-tags", label: "Теги товаров"},
    {prefix: "/settings/product-properties", label: "Свойства товаров"},
    {prefix: "/settings/product-variant-statuses", label: "Статусы вариантов"},
    {prefix: "/settings/product-storages", label: "Склады"},
    {prefix: "/settings/sources", label: "Источники заказов"},
    {prefix: "/settings/order-statuses", label: "Статусы заказов"},
    {prefix: "/settings/notifications", label: "Уведомления"},
    {prefix: "/settings/payments", label: "Платежи"},
    {prefix: "/settings/integrations", label: "Интеграции"},
    {prefix: "/settings/countries", label: "Страны и города"},
    {prefix: "/settings/sales-points", label: "Точки продаж"},
    {prefix: "/settings/colors", label: "Цвета"},
    {prefix: "/settings/sizes", label: "Размеры"},
    {prefix: "/settings/collections", label: "Коллекции"},
    {prefix: "/settings/promo-codes", label: "Промокоды"},
    {prefix: "/settings", label: "Настройки"},
    {prefix: "/", label: "Рабочий стол"}
]

const getReturnPageLabel = (returnPath: string) => {
    const pathname = returnPath.split(/[?#]/)[0] || "/"
    const match = RETURN_PAGE_LABELS.find(({prefix}) => pathname === prefix || pathname.startsWith(`${prefix}/`))

    return match?.label ?? "Запрошенный раздел"
}

const LoginPage = () => {
    const [form] = Form.useForm<LoginFormValues>()
    const [lastLoginError, setLastLoginError] = useState<string | null>(null)
    const [isCapsLockOn, setIsCapsLockOn] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const {accessToken} = useSelectedAuthData()
    const returnPath = getSafeReturnPath((location.state as LoginLocationState | null)?.returnTo)
    const hasReturnPath = returnPath !== "/"
    const returnPageLabel = getReturnPageLabel(returnPath)

    const [login, {isLoading: isLoginLoading}] = useLoginMutation()

    useEffect(() => {
        if (accessToken) {
            navigate(returnPath, {replace: true})
        }
    }, [accessToken, navigate, returnPath])

    const onSubmit = async (values: LoginFormValues) => {
        setLastLoginError(null)

        try {
            const payload = await login({email: values.email, password: values.password}).unwrap()

            dispatch(setAuthData(payload))
            message.success("Вы успешно вошли")
            navigate(returnPath, {replace: true})
        } catch (error) {
            const errorMessage = getNestErrorMessage(error)
            setLastLoginError(errorMessage)
            message.error(errorMessage)
        }
    }

    return (
        <div style={{minHeight: "100vh", padding: "28px 16px", display: "grid", placeItems: "center"}}>
            <Card style={{width: "100%", maxWidth: 1020, borderRadius: 24}}>
                <Row gutter={[28, 28]} align="middle">
                    <Col xs={24} lg={12}>
                        <Space orientation="vertical" size={14}>
                            <Tag color="lime" style={{alignSelf: "flex-start"}}>KOKORO ADMIN</Tag>
                            <Typography.Title level={2} style={{margin: 0}}>
                                Современная панель управления
                            </Typography.Title>
                            <Typography.Paragraph type="secondary" style={{marginBottom: 0}}>
                                Быстрый вход в систему управления сотрудниками, ролями и операционными процессами.
                            </Typography.Paragraph>
                            <Space orientation="vertical" size={8}>
                                <Typography.Text><SafetyOutlined /> Защищённая авторизация и refresh-flow</Typography.Text>
                                <Typography.Text><ThunderboltOutlined /> Быстрая работа с таблицами и фильтрами</Typography.Text>
                                <Typography.Text><LockOutlined /> RBAC-доступы для администраторов</Typography.Text>
                            </Space>
                        </Space>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card variant="borderless" style={{background: "rgba(120,140,160,0.08)", borderRadius: 18}}>
                            <Typography.Title level={4} style={{marginTop: 0}}>
                                Вход в аккаунт
                            </Typography.Title>
                            {hasReturnPath && (
                                <Alert
                                    type="info"
                                    showIcon
                                    style={{marginBottom: 16}}
                                    message={`Вернём вас в раздел «${returnPageLabel}» после входа`}
                                    description={
                                        <Typography.Text type="secondary">
                                            Безопасный внутренний путь: {returnPath}
                                        </Typography.Text>
                                    }
                                />
                            )}

                            {lastLoginError && (
                                <Alert
                                    type="error"
                                    showIcon
                                    style={{marginBottom: 16}}
                                    message="Не удалось войти"
                                    description="Проверьте email и пароль. Если доступ должен быть открыт, обратитесь к администратору — не создавайте новый пароль в переписке и не пересылайте текущий."
                                />
                            )}

                            <Form<LoginFormValues> form={form} layout="vertical" onFinish={onSubmit}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        {required: true, message: "Введите email"},
                                        {type: "email", message: "Неверный формат email"}
                                    ]}
                                >
                                    <Input placeholder="Введите рабочий email" size="large" autoComplete="username" />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    label="Пароль"
                                    extra={isCapsLockOn ? "Включён Caps Lock — из-за этого пароль может не подойти." : "Не используйте примерные или пересланные пароли; запросите безопасный сброс у администратора."}
                                    validateStatus={isCapsLockOn ? "warning" : undefined}
                                    rules={[
                                        {required: true, message: "Введите пароль"},
                                        {min: 8, message: "Минимум 8 символов"},
                                        {max: 100, message: "Максимум 100 символов"}
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Введите пароль"
                                        size="large"
                                        autoComplete="current-password"
                                        onKeyUp={(event) => setIsCapsLockOn(event.getModifierState("CapsLock"))}
                                        onBlur={() => setIsCapsLockOn(false)}
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={isLoginLoading}
                                >
                                    Войти
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    )
}

export default LoginPage
