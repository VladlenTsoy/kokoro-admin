import {Breadcrumb, Layout as AntdLayout, theme} from "antd"
import HeaderMenu from "./header/HeaderMenu.tsx"
import {createStyles} from "antd-style"

const {Header, Content, Footer} = AntdLayout

const useStyles = createStyles(() => ({
    header: {
        display: "flex",
        alignItems: "center",
    }
}))

const Layout = () => {
    const {
        token: {colorBgContainer, borderRadiusLG}
    } = theme.useToken()
    const {styles} = useStyles()


    return (
        <AntdLayout>
            <Header className={styles.header}>
                <HeaderMenu />
            </Header>
            <Content style={{padding: "0 48px"}}>
                <Breadcrumb
                    style={{margin: "16px 0"}}
                    items={[{title: "Home"}, {title: "List"}, {title: "App"}]}
                />
                <div
                    style={{
                        background: colorBgContainer,
                        minHeight: 280,
                        padding: 24,
                        borderRadius: borderRadiusLG
                    }}
                >
                    Content
                </div>
            </Content>
            <Footer style={{textAlign: "center"}}>
                Ant Design ©{new Date().getFullYear()} Created by Ant UED
            </Footer>
        </AntdLayout>
    )
}

export default Layout