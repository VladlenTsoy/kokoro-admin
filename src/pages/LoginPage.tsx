import {Alert, Button, Card, Col, Form, Input, Row, Space, Tag, Typography, message} from "antd"
import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useLoginMutation} from "../features/admin/authApi.ts"
import {useDispatch} from "../features/store.ts"
import {setAuthData, useSelectedAuthData} from "../features/auth/authSlice.ts"
import {getNestErrorMessage} from "../utils/getNestErrorMessage.ts"
import {LockOutlined, SafetyOutlined, ThunderboltOutlined} from "@ant-design/icons"

interface LoginFormValues {
    email: string
    password: string
}

const LoginPage = () => {
    const [form] = Form.useForm<LoginFormValues>()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const {accessToken} = useSelectedAuthData()
    const [loginError, setLoginError] = useState<string | null>(null)

    const [login, {isLoading: isLoginLoading}] = useLoginMutation()

    useEffect(() => {
        if (accessToken) {
            navigate("/", {replace: true})
        }
    }, [accessToken, navigate])

    const onSubmit = async (values: LoginFormValues) => {
        setLoginError(null)

        try {
            const payload = await login({email: values.email, password: values.password}).unwrap()

            dispatch(setAuthData(payload))
            message.success("Вы успешно вошли")
            navigate("/", {replace: true})
        } catch (error) {
            const errorMessage = getNestErrorMessage(error)
            setLoginError(errorMessage)
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
                            <Form<LoginFormValues> form={form} layout="vertical" onFinish={onSubmit} disabled={isLoginLoading}>
                                {loginError && (
                                    <Alert
                                        showIcon
                                        type="error"
                                        message="Не удалось войти"
                                        description={
                                            <Space direction="vertical" size={4}>
                                                <Typography.Text>{loginError}</Typography.Text>
                                                <Typography.Text type="secondary">
                                                    Проверьте email и пароль. Если доступ должен быть открыт, передайте администратору этот текст ошибки без пароля.
                                                </Typography.Text>
                                            </Space>
                                        }
                                        style={{marginBottom: 16}}
                                    />
                                )}

                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        {required: true, message: "Введите email"},
                                        {type: "email", message: "Неверный формат email"}
                                    ]}
                                >
                                    <Input placeholder="admin@kokoro.uz" size="large" autoComplete="username" />
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
                                    <Input.Password placeholder="Введите пароль" size="large" autoComplete="current-password" />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={isLoginLoading}
                                >
                                    {isLoginLoading ? "Проверяем доступ…" : "Войти"}
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
