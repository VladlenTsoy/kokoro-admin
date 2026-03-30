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
        borderRadius: token.borderRadiusLG + 8
    },
    menu: {
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        flex: 1
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0
    },
    content: {
        padding: 20
    },
    surface: {
        borderRadius: token.borderRadiusLG + 10,
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        minHeight: "calc(100vh - 190px)",
        padding: 22,
        boxShadow: "0 16px 50px rgba(10, 20, 32, 0.08)"
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
