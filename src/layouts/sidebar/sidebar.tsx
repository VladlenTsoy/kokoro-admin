import React from "react"
import {Menu} from "antd"
import {HomeOutlined, SkinOutlined} from "@ant-design/icons"
import {Link, useLocation} from "react-router-dom"

const menuItems = [
    {icon: <HomeOutlined />, label: <Link to="/">Главная</Link>, key: ""},
    {
        icon: <SkinOutlined />,
        label: <Link to="/products">Продукты</Link>,
        key: "products"
    }
]

interface SidebarProps {
    collapsed: boolean;
    onCollapsedMenuItems: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({collapsed, onCollapsedMenuItems}) => {
    const location = useLocation()
    const pathnameArray = location.pathname.split("/")

    return (
        <div>
            <Menu
                theme="dark"
                mode="inline"
                items={menuItems}
                defaultSelectedKeys={[pathnameArray[1]]}
                onClick={onCollapsedMenuItems}
            />
        </div>
    )
}

export default Sidebar
