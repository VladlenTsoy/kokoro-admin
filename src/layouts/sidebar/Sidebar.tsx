import React from "react";
import styles from "./Sidebar.module.less";
import { Menu } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { HomeOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { icon: <HomeOutlined />, label: <Link to="/">Главная</Link>, key: "" },
  {
    icon: <ShoppingOutlined />,
    label: <Link to="/products/all">Продукты</Link>,
    key: "products",
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedMenuItems: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapsedMenuItems,
}) => {
  const location = useLocation();
  const pathnameArray = location.pathname.split("/");

  return (
    <div className={styles.logoMenuSticky}>
      <div className={styles.logo}>
        <div className={styles.logoImage}></div>
        <AnimatePresence>
          <div className={styles.title}>
            {!collapsed && (
              <motion.div
                animate={{ opacity: 1, x: 0, transition: { delay: 0.25 } }}
                initial={{ opacity: 0, x: "100%" }}
                exit={{ opacity: 0, x: "100%" }}
                key="icon"
                className={styles.text}
              ></motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
        defaultSelectedKeys={[pathnameArray[1]]}
        className={styles.siteLayoutMenu}
        onClick={onCollapsedMenuItems}
      />
    </div>
  );
};

export default Sidebar;
