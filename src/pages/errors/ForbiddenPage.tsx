import {Button, Result, Space, Typography} from "antd"
import {useLocation, useNavigate} from "react-router-dom"

type ForbiddenLocationState = {
    from?: string
    permissionLabel?: string
}

const ForbiddenPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as ForbiddenLocationState | null
    const requestedPath = state?.from
    const permissionLabel = state?.permissionLabel

    return (
        <Result
            status="403"
            title="Недостаточно прав"
            subTitle={permissionLabel
                ? `Для этого действия нужен доступ: ${permissionLabel}.`
                : "У вашей роли нет доступа к этому разделу."}
            extra={(
                <Space direction="vertical" size="middle">
                    <Typography.Text type="secondary">
                        {requestedPath
                            ? `Запрошенный раздел: ${requestedPath}. Покажите это администратору, чтобы он быстрее выдал нужную роль.`
                            : "Если доступ нужен по работе, попросите администратора проверить вашу роль."}
                    </Typography.Text>
                    <Space wrap>
                        <Button type="primary" onClick={() => navigate("/")}>На дашборд</Button>
                        <Button onClick={() => navigate(-1)}>Вернуться назад</Button>
                    </Space>
                </Space>
            )}
        />
    )
}

export default ForbiddenPage
