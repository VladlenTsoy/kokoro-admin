import {Alert, Avatar, Button, Dropdown, Form, Input, Modal, Space, Typography, message} from "antd"
import type {MenuProps} from "antd"
import {useState} from "react"
import {useNavigate} from "react-router-dom"
import {clearAuthData, useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {useDispatch} from "../../features/store.ts"
import {useChangePasswordMutation, useLogoutMutation} from "../../features/admin/authApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {DownOutlined, ExclamationCircleOutlined, UserOutlined} from "@ant-design/icons"

const HeaderProfile = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const {employee, refreshToken} = useSelectedAuthData()
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [changePassword, {isLoading: isChangingPassword}] = useChangePasswordMutation()
    const [logout, {isLoading: isLoggingOut}] = useLogoutMutation()
    const [form] = Form.useForm<{currentPassword: string; newPassword: string; confirmPassword: string}>()

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await logout({refreshToken}).unwrap()
            }
        } catch {
            // Даже если серверный logout не удался, локальную сессию нужно завершить.
        } finally {
            dispatch(clearAuthData("manual_logout"))
            navigate("/login", {replace: true})
        }
    }

    const closePasswordModal = () => {
        if (isChangingPassword) return

        setIsPasswordModalOpen(false)
        form.resetFields()
    }

    const handleChangePassword = async () => {
        try {
            const {currentPassword, newPassword} = await form.validateFields()
            await changePassword({currentPassword, newPassword}).unwrap()
            message.success("Пароль изменён. Используйте новый пароль при следующем входе.")
            closePasswordModal()
        } catch (error) {
            if (typeof error === "object" && error !== null && "errorFields" in error) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const menuItems: MenuProps["items"] = [
        {key: "changePassword", label: "Сменить пароль"},
        {key: "logout", label: "Выйти", danger: true}
    ]

    const confirmLogout = () => {
        Modal.confirm({
            title: "Выйти из админ-панели?",
            icon: <ExclamationCircleOutlined />,
            content: "Проверьте, что текущие правки в формах сохранены. После выхода для продолжения работы потребуется снова войти в аккаунт.",
            okText: "Выйти",
            okButtonProps: {danger: true},
            cancelText: "Остаться",
            onOk: handleLogout
        })
    }

    const onMenuClick: MenuProps["onClick"] = ({key}) => {
        if (key === "changePassword") {
            setIsPasswordModalOpen(true)
            return
        }

        if (key === "logout") {
            confirmLogout()
        }
    }

    if (!employee) {
        return null
    }

    return (
        <>
            <Dropdown menu={{items: menuItems, onClick: onMenuClick}} trigger={["click"]}>
                <Button loading={isLoggingOut} size="large">
                    <Space size={8}>
                        <Avatar size={24} icon={<UserOutlined />} />
                        <span>{employee.firstName} {employee.lastName}</span>
                        <DownOutlined style={{fontSize: 12}} />
                    </Space>
                </Button>
            </Dropdown>
            <Modal
                title="Смена пароля"
                open={isPasswordModalOpen}
                onCancel={closePasswordModal}
                onOk={handleChangePassword}
                okText={isChangingPassword ? "Сохраняем пароль..." : "Сохранить пароль"}
                cancelText="Отмена"
                confirmLoading={isChangingPassword}
                okButtonProps={{disabled: isChangingPassword}}
                cancelButtonProps={{disabled: isChangingPassword}}
                maskClosable={!isChangingPassword}
                keyboard={!isChangingPassword}
                destroyOnHidden
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {isChangingPassword && (
                        <Alert
                            showIcon
                            type="info"
                            message="Сохраняем новый пароль"
                            description="Не закрывайте окно и не меняйте поля, пока API подтверждает смену пароля. Это снижает риск повторной отправки разных значений."
                        />
                    )}
                    <Typography.Paragraph type="secondary">
                        Пароль должен быть длиной от 8 до 100 символов и отличаться от текущего. Повторите новый пароль,
                        чтобы избежать ошибки при вводе. После сохранения продолжайте работу в текущей сессии, а при
                        следующем входе используйте новый пароль.
                    </Typography.Paragraph>
                </Space>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Текущий пароль"
                        name="currentPassword"
                        rules={[{required: true, message: "Введите текущий пароль"}]}
                    >
                        <Input.Password autoComplete="current-password" disabled={isChangingPassword} placeholder="Введите действующий пароль" />
                    </Form.Item>
                    <Form.Item
                        label="Новый пароль"
                        name="newPassword"
                        dependencies={["currentPassword"]}
                        rules={[
                            {required: true, message: "Введите новый пароль"},
                            {min: 8, message: "Минимум 8 символов"},
                            {max: 100, message: "Максимум 100 символов"},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!value || value !== getFieldValue("currentPassword")) {
                                        return Promise.resolve()
                                    }

                                    return Promise.reject(new Error("Новый пароль должен отличаться от текущего"))
                                }
                            })
                        ]}
                    >
                        <Input.Password autoComplete="new-password" disabled={isChangingPassword} placeholder="8–100 символов" />
                    </Form.Item>
                    <Form.Item
                        label="Повторите новый пароль"
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                            {required: true, message: "Повторите новый пароль"},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                        return Promise.resolve()
                                    }

                                    return Promise.reject(new Error("Пароли не совпадают"))
                                }
                            })
                        ]}
                    >
                        <Input.Password autoComplete="new-password" disabled={isChangingPassword} placeholder="Введите новый пароль ещё раз" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default HeaderProfile
