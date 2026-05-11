import {Button, Result, Space, Typography} from "antd"
import {useLocation, useNavigate} from "react-router-dom"

const {Text} = Typography

const NotFoundPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const requestedPath = `${location.pathname}${location.search}`

    return (
        <Result
            status="404"
            title="Раздел не найден"
            subTitle={
                <Space direction="vertical" size={4}>
                    <Text>Адрес {requestedPath} не совпал с доступными разделами админки.</Text>
                    <Text type="secondary">
                        Проверьте ссылку или вернитесь в рабочий раздел, чтобы не потерять контекст смены.
                    </Text>
                </Space>
            }
            extra={
                <Space wrap>
                    <Button type="primary" onClick={() => navigate("/")}>На дашборд</Button>
                    <Button onClick={() => navigate("/orders")}>К заказам</Button>
                    <Button onClick={() => navigate("/products")}>К каталогу</Button>
                    <Button onClick={() => navigate(-1)}>Назад</Button>
                </Space>
            }
        />
    )
}

export default NotFoundPage
