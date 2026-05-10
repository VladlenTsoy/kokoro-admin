import {Alert, Button, Card, Col, Form, Input, Row, Space, Tag, Typography, message} from "antd"
import {useEffect} from "react"
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

const LoginPage = () => {
    const [form] = Form.useForm<LoginFormValues>()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const {accessToken} = useSelectedAuthData()
    const returnPath = getSafeReturnPath((location.state as LoginLocationState | null)?.returnTo)
    const hasReturnPath = returnPath !== "/"

    const [login, {isLoading: isLoginLoading}] = useLoginMutation()

    useEffect(() => {
        if (accessToken) {
            navigate(returnPath, {replace: true})
        }
    }, [accessToken, navigate, returnPath])

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const payload = await login({email: values.email, password: values.password}).unwrap()

            dispatch(setAuthData(payload))
            message.success("Вы успешно вошли")
            navigate(returnPath, {replace: true})
        } catch (error) {
            message.error(getNestErrorMessage(error))
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
                                    message="Вернём вас на запрошенную страницу после входа"
                                    description={returnPath}
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
                                    <Input placeholder="admin@kokoro.uz" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    label="Пароль"
                                    rules={[
                                        {required: true, message: "Введите пароль"},
                                        {min: 8, message: "Минимум 8 символов"},
                                        {max: 100, message: "Максимум 100 символов"}
                                    ]}
                                >
                                    <Input.Password placeholder="StrongPassword123" size="large" />
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
