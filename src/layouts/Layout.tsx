import {Layout as AntdLayout} from "antd"
import HeaderMenu from "./header/HeaderMenu.tsx"
import {createStyles} from "antd-style"
import HeaderSearch from "./header/HeaderSearch.tsx"
import HeaderNotification from "./header/HeaderNotification.tsx"
import HeaderLanguage from "./header/HeaderLanguage.tsx"
import HeaderProfile from "./header/HeaderProfile.tsx"
import {Outlet} from "react-router-dom"
import HeaderThemeSwitch from "./header/HeaderThemeSwitch.tsx"
import HeaderSettingsButton from "./header/HeaderSettingsButton.tsx"

const {Header, Content, Footer} = AntdLayout

const useStyles = createStyles(({token}) => ({
    root: {
        minHeight: "100vh",
        background: "transparent"
    },
    header: {
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
        background: token.colorBgContainer,
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
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
        padding: 20,
        "@media (max-width: 768px)": {
            padding: 12
        }
    },
    surface: {
        borderRadius: token.borderRadiusLG + 10,
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        minHeight: "calc(100vh - 190px)",
        padding: 22,
        boxShadow: "0 16px 50px rgba(10, 20, 32, 0.08)",
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
