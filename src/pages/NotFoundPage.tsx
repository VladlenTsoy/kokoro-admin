import {Button, Card, Result, Space, Typography} from "antd"
import {HomeOutlined, RollbackOutlined, SettingOutlined} from "@ant-design/icons"
import {Link, useNavigate} from "react-router-dom"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token, css}) => ({
    page: css`
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        background: ${token.colorBgLayout};
    `,
    card: css`
        width: min(100%, 720px);
        box-shadow: ${token.boxShadowTertiary};
    `,
    actions: css`
        justify-content: center;

        @media (max-width: ${token.screenSM}px) {
            width: 100%;

            .ant-space-item,
            .ant-btn {
                width: 100%;
            }
        }
    `
}))

const NotFoundPage = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()

    return (
        <main className={styles.page}>
            <Card className={styles.card}>
                <Result
                    status="404"
                    title="Страница не найдена"
                    subTitle="Проверьте адрес или вернитесь в рабочий раздел. Это поможет менеджеру быстрее продолжить смену без поиска нужного экрана вручную."
                    extra={(
                        <Space wrap className={styles.actions}>
                            <Button type="primary" icon={<HomeOutlined />}>
                                <Link to="/">На дашборд</Link>
                            </Button>
                            <Button icon={<SettingOutlined />}>
                                <Link to="/settings">В настройки</Link>
                            </Button>
                            <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
                                Назад
                            </Button>
                        </Space>
                    )}
                />
                <Typography.Paragraph type="secondary" style={{textAlign: "center", marginBottom: 0}}>
                    Если ссылка пришла из меню или инструкции, передайте адрес администратору — возможно, маршрут устарел.
                </Typography.Paragraph>
            </Card>
        </main>
    )
}

export default NotFoundPage
