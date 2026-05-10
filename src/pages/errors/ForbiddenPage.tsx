import {Button, Card, Result, Space, Typography} from "antd"
import {HomeOutlined, RollbackOutlined, TeamOutlined} from "@ant-design/icons"
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

const ForbiddenPage = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()

    return (
        <main className={styles.page}>
            <Card className={styles.card}>
                <Result
                    status="403"
                    title="Недостаточно прав"
                    subTitle="У вас нет доступа к этому разделу. Вернитесь в доступный рабочий экран или попросите администратора проверить роль и разрешения."
                    extra={(
                        <Space wrap className={styles.actions}>
                            <Button type="primary" icon={<HomeOutlined />}>
                                <Link to="/">На дашборд</Link>
                            </Button>
                            <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
                                Назад
                            </Button>
                            <Button icon={<TeamOutlined />}>
                                <Link to="/settings/roles">Роли и доступы</Link>
                            </Button>
                        </Space>
                    )}
                />
                <Typography.Paragraph type="secondary" style={{textAlign: "center", marginBottom: 0}}>
                    Если доступ нужен для смены, укажите администратору действие и раздел — так проще проверить конкретное разрешение.
                </Typography.Paragraph>
            </Card>
        </main>
    )
}

export default ForbiddenPage
