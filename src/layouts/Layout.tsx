import {Button, Layout as AntdLayout} from "antd"
import React, {useState} from "react"
import Sidebar from "./sidebar/sidebar"
import {createUseStyles} from "react-jss"
import {MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons"

const useStyles = createUseStyles({
    layout: {
        minHeight: "100vh"
    },
    content: {
        padding: "25px"
    }
})

const {Header, Sider, Content} = AntdLayout

type Props = {
    children: React.ReactNode
}

const Layout: React.FC<Props> = (props: Props) => {
    const classes = useStyles()
    const [collapsed, setCollapsed] = useState(true)
    const onCollapsedHandler = () => {
        setCollapsed(prevState => !prevState)
    }
    const onCollapsedMenuItems = () => {
        setCollapsed(prevState => (prevState === false ? !prevState : prevState))
    }

    return (
        <AntdLayout className={classes.layout}>
            <Sider collapsible collapsed={collapsed} width="250px" trigger={null}>
                <Sidebar collapsed={collapsed} onCollapsedMenuItems={onCollapsedMenuItems} />
            </Sider>
            <AntdLayout>
                <Header>
                    <div>
                        {React.createElement(Button, {
                            onClick: onCollapsedHandler,
                            icon: collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />,
                            size: "large",
                            shape: "circle"
                        })}
                    </div>
                </Header>
                <Content className={classes.content} id="site-layout-content">
                    {props.children}
                </Content>
            </AntdLayout>
        </AntdLayout>
    )
}

export default Layout
