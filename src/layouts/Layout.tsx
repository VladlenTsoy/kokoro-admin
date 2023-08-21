import React, { useEffect, useState } from "react";
import { Button, Layout as AntdLayout } from "antd";
import { useScreenWindow } from "../hooks/use-screen-window.effect";
import styles from "./Layout.module.less";
import { useDispatch } from "../store";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";

const { Header, Sider, Content } = AntdLayout;

type Props = {
  children?: React.ReactNode;
};

const Titles: any = {
  "/": "Главная",
  "/products": "Продукты",
};

const Layout: React.FC<Props> = ({ children }) => {
  const [, isBreakpoint] = useScreenWindow({ breakpoint: "lg" });
  // const history = useHistory()
  // const dispatch = useDispatch()
  const [collapsed, setCollapsed] = useState(true);
  let location = useLocation();
  // const location = useLocation()

  const onCollapsedHandler = () => {
    setCollapsed((prevState) => !prevState);
  };

  const onCollapsedMenuItems = () => {
    setCollapsed((prevState) => (prevState === false ? !prevState : prevState));
  };

  React.useEffect(() => {
    setCollapsed(true);
  }, [location]);

  return (
    <AntdLayout className={styles.layout}>
      <Sider
        collapsible
        collapsed={collapsed}
        width="250px"
        trigger={null}
        collapsedWidth={isBreakpoint ? 0 : 80}
      >
        <Sidebar
          collapsed={collapsed}
          onCollapsedMenuItems={onCollapsedMenuItems}
        />
      </Sider>
      <AntdLayout className={styles.siteLayout}>
        <Header className={styles.siteLayoutHeader}>
          <div className={styles.optionsHeader}>
            {React.createElement(Button, {
              onClick: onCollapsedHandler,
              icon: collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />,
              size: "large",
              shape: "circle",
            })}
          </div>
        </Header>
        <Content className={styles.siteLayoutContent} id="site-layout-content">
          {children}
        </Content>
      </AntdLayout>
    </AntdLayout>
  );
};

export default Layout;
