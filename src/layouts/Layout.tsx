import {Breadcrumb, Layout as AntdLayout} from "antd"
import HeaderMenu from "./header/HeaderMenu.tsx"
import {createStyles} from "antd-style"
import HeaderSearch from "./header/HeaderSearch.tsx"
import HeaderNotification from "./header/HeaderNotification.tsx"
import HeaderLanguage from "./header/HeaderLanguage.tsx"
import HeaderProfile from "./header/HeaderProfile.tsx"
import {Outlet} from "react-router-dom"

const {Header, Content, Footer} = AntdLayout

const useStyles = createStyles(() => ({
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },
    menu: {
        display: "flex",
        alignItems: "center"
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: 6
    }
}))

const Layout = () => {
    // const {
    //     token: {colorBgContainer, borderRadiusLG}
    // } = theme.useToken()
    const {styles} = useStyles()


    return (
        <AntdLayout>
            <Header className={styles.header}>
                <div className={styles.menu}>
                    <HeaderMenu />
                </div>
                <div className={styles.right}>
                    <HeaderSearch />
                    <HeaderNotification />
                    <HeaderLanguage />
                    <HeaderProfile />
                </div>
            </Header>
            <Content style={{padding: "0 48px"}}>
                <Breadcrumb
                    style={{margin: "16px 0"}}
                    items={[{title: "Home"}, {title: "List"}, {title: "App"}]}
                />
                {/*<div*/}
                {/*    style={{*/}
                {/*        background: colorBgContainer,*/}
                {/*        minHeight: 280,*/}
                {/*        padding: 24,*/}
                {/*        borderRadius: borderRadiusLG*/}
                {/*    }}*/}
                {/*>*/}
                    <Outlet />
                {/*</div>*/}
            </Content>
            <Footer style={{textAlign: "center"}}>
                Ant Design ©{new Date().getFullYear()} Created by Ant UED
            </Footer>
        </AntdLayout>
    )
}

export default Layout