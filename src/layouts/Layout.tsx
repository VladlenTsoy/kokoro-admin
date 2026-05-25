import {Layout as AntdLayout, Space, Tag, Typography} from "antd"
import HeaderMenu from "./header/HeaderMenu.tsx"
import {createStyles} from "antd-style"
import HeaderSearch from "./header/HeaderSearch.tsx"
import HeaderNotification from "./header/HeaderNotification.tsx"
import HeaderLanguage from "./header/HeaderLanguage.tsx"
import HeaderProfile from "./header/HeaderProfile.tsx"
import {Outlet, useLocation} from "react-router-dom"
import HeaderThemeSwitch from "./header/HeaderThemeSwitch.tsx"
import HeaderSettingsButton from "./header/HeaderSettingsButton.tsx"

const {Header, Content, Footer} = AntdLayout

const sectionMeta = [
    {match: (pathname: string) => pathname === "/", title: "Today Operations", hint: "Смена, деньги, риски"},
    {match: (pathname: string) => pathname.startsWith("/orders"), title: "Order Desk", hint: "Очередь заказов сегодня"},
    {match: (pathname: string) => pathname.startsWith("/clients"), title: "Client CRM", hint: "История, бонусы, заказы"},
    {match: (pathname: string) => pathname.startsWith("/settings"), title: "Launch Control", hint: "Настройки запуска"},
    {match: (pathname: string) => pathname.startsWith("/products"), title: "Catalog", hint: "Товары и остатки"},
    {match: (pathname: string) => pathname.startsWith("/search-zero-results"), title: "Search Insights", hint: "Нулевые результаты"}
]

const useStyles = createStyles(({token}) => ({
    root: {
        minHeight: "100vh",
        background: "transparent",
        position: "relative",
        overflowX: "hidden",
        "&::before": {
            content: '""',
            position: "fixed",
            inset: "0 0 auto 0",
            height: 280,
            background: "radial-gradient(circle at 12% 12%, rgba(177, 232, 28, 0.2), transparent 34%), radial-gradient(circle at 88% 0%, rgba(22, 119, 255, 0.13), transparent 30%)",
            pointerEvents: "none",
            zIndex: 0
        }
    },
    header: {
        position: "sticky",
        top: 12,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        height: 80,
        lineHeight: "80px",
        paddingInline: 20,
        margin: "14px 14px 0",
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG + 8,
        background: `color-mix(in srgb, ${token.colorBgContainer} 88%, transparent)`,
        boxShadow: "0 14px 42px rgba(15, 23, 42, 0.09)",
        backdropFilter: "blur(18px)",
        "@media (max-width: 1100px)": {
            alignItems: "stretch",
            flexDirection: "column",
            height: "auto",
            lineHeight: 1.5,
            paddingBlock: 14
        }
    },
    menu: {
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        flex: 1,
        "@media (max-width: 1100px)": {
            width: "100%"
        }
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
        "@media (max-width: 1100px)": {
            justifyContent: "flex-end",
            flexWrap: "wrap"
        },
        "@media (max-width: 760px)": {
            alignItems: "stretch",
            display: "grid",
            gridTemplateColumns: "1fr repeat(5, auto)",
            width: "100%"
        },
        "@media (max-width: 520px)": {
            gridTemplateColumns: "repeat(5, auto)",
            justifyContent: "start",
            overflowX: "auto",
            paddingBottom: 2,
            scrollbarWidth: "thin"
        }
    },
    content: {
        position: "relative",
        zIndex: 1,
        padding: 20,
        "@media (max-width: 768px)": {
            padding: 12
        }
    },
    commandStrip: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        margin: "0 0 12px",
        padding: "10px 14px",
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG + 8,
        background: `color-mix(in srgb, ${token.colorBgContainer} 74%, transparent)`,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.055)",
        backdropFilter: "blur(14px)",
        "@media (max-width: 680px)": {
            alignItems: "flex-start",
            flexDirection: "column"
        }
    },
    commandTitle: {
        margin: 0,
        lineHeight: 1.15
    },
    commandCopy: {
        minWidth: 0
    },
    surface: {
        borderRadius: token.borderRadiusLG + 10,
        border: `1px solid ${token.colorBorder}`,
        background: `color-mix(in srgb, ${token.colorBgContainer} 94%, transparent)`,
        minHeight: "calc(100vh - 190px)",
        padding: 22,
        boxShadow: "0 18px 58px rgba(10, 20, 32, 0.075)",
        backdropFilter: "blur(10px)",
        "@media (max-width: 768px)": {
            padding: 14,
            borderRadius: token.borderRadiusLG
        }
    },
    footer: {
        textAlign: "center",
        background: "transparent",
        color: token.colorTextSecondary,
        paddingBottom: 20
    }
}))

const Layout = () => {
    const {styles} = useStyles()
    const {pathname} = useLocation()
    const currentSection = sectionMeta.find((item) => item.match(pathname)) ?? {title: "Admin", hint: "Рабочая зона"}

    return (
        <AntdLayout className={styles.root}>
            <Header className={styles.header}>
                <div className={styles.menu}>
                    <HeaderMenu />
                </div>
                <div className={styles.right}>
                    <HeaderSearch />
                    <HeaderSettingsButton />
                    <HeaderNotification />
                    <HeaderThemeSwitch />
                    <HeaderLanguage />
                    <HeaderProfile />
                </div>
            </Header>
            <Content className={styles.content}>
                <div className={styles.commandStrip}>
                    <div className={styles.commandCopy}>
                        <Typography.Text type="secondary">Kokoro admin cockpit</Typography.Text>
                        <Typography.Title level={4} className={styles.commandTitle}>{currentSection.title}</Typography.Title>
                    </div>
                    <Space wrap size={[8, 8]}>
                        <Tag color="lime">Redesign MVP</Tag>
                        <Tag>{currentSection.hint}</Tag>
                    </Space>
                </div>
                <section className={styles.surface}>
                    <Outlet />
                </section>
            </Content>
            <Footer className={styles.footer}>
                KOKORO Admin • {new Date().getFullYear()}
            </Footer>
        </AntdLayout>
    )
}

export default Layout
