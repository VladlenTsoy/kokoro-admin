import {LockOutlined, SafetyCertificateOutlined} from "@ant-design/icons"
import {Card, Space, Spin, Typography} from "antd"
import {createStyles} from "antd-style"

type AuthGateLoadingVariant = "session" | "permission"

interface AuthGateLoadingProps {
    variant?: AuthGateLoadingVariant
}

const COPY: Record<AuthGateLoadingVariant, {title: string; description: string}> = {
    session: {
        title: "Проверяем доступ менеджера",
        description: "Обновляем профиль и права доступа перед открытием админки."
    },
    permission: {
        title: "Сверяем права для раздела",
        description: "Проверяем роль менеджера, чтобы открыть только доступные инструменты."
    }
}

const useStyles = createStyles(({token, css}) => ({
    root: css`
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
            linear-gradient(180deg, ${token.colorPrimaryBg} 0%, transparent 40%),
            ${token.colorBgLayout};
    `,
    card: css`
        width: min(440px, 100%);
        border-color: ${token.colorBorderSecondary};
        box-shadow: ${token.boxShadowTertiary};

        .ant-card-body {
            padding: 28px;
        }
    `,
    icon: css`
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: ${token.borderRadiusLG}px;
        background: ${token.colorPrimaryBg};
        color: ${token.colorPrimary};
        font-size: 20px;
    `,
    title: {
        margin: 0
    },
    description: {
        display: "block"
    }
}))

const AuthGateLoading = ({variant = "session"}: AuthGateLoadingProps) => {
    const {styles} = useStyles()
    const copy = COPY[variant]
    const Icon = variant === "permission" ? SafetyCertificateOutlined : LockOutlined

    return (
        <section className={styles.root} aria-busy="true" aria-live="polite">
            <Card className={styles.card}>
                <Space size={18} align="start">
                    <span className={styles.icon} aria-hidden="true">
                        <Icon />
                    </span>
                    <Space direction="vertical" size={8}>
                        <Typography.Title level={4} className={styles.title}>
                            {copy.title}
                        </Typography.Title>
                        <Typography.Text type="secondary" className={styles.description}>
                            {copy.description}
                        </Typography.Text>
                        <Spin size="small" />
                    </Space>
                </Space>
            </Card>
        </section>
    )
}

export default AuthGateLoading
