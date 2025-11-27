import React from "react"
import {Button, Card, Divider, Space, Typography} from "antd"
import {DropboxOutlined, PlusOutlined} from "@ant-design/icons"
import {Link as RouteLink, useParams} from "react-router-dom"
import {createStyles} from "antd-style"
import NavigationSection from "./navigation-section/NavigationSection.tsx"

const {Title} = Typography

const useStyles = createStyles(({token}) => ({
    menuItem: {
        display: "flex",
        fontSize: `${token.fontSizeLG}px`,
        padding: "0.75rem 1.25rem",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out",
        color: token.colorTextSecondary,
        borderRadius: 15,
        alignItems: "center",
        gap: 8,

        "&:hover": {
            color: token.colorText,
            backgroundColor: "#F8F9F9"
        }
    },

    active: {
        color: token.colorText,
        backgroundColor: "#F8F9F9"
    },

    content: {
        position: "sticky",
        top: "1rem"
    }
}))

interface LeftSidebarProps {
    colors?: {id: number; title: string; hex: string; product_id: number}[];
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({colors}) => {
    const params = useParams<{id: string; color: string}>()
    const {styles} = useStyles()

    return (
        <div className={styles.content}>
            <Card>
                <Title level={3}>Добавить товар</Title>
                <Divider size="small" />
                <NavigationSection />

                {!params?.color &&
                    colors &&
                    colors.map(
                        (color) =>
                            color.product_id !== Number(params.id) && (
                                <RouteLink
                                    replace
                                    key={color.id}
                                    to={`/products/product/edit/${color.product_id}`}
                                    className={styles.menuItem}
                                >
                                    #{color.product_id} {color.title}
                                </RouteLink>
                            )
                    )}

                {params.id && !params.color && (
                    <div className={styles.menuItem}>
                        <RouteLink to={`/products/product/edit/${params.id}/color`}>
                            <Button type="dashed" icon={<PlusOutlined />} size="large" block>
                                Добавить цвет
                            </Button>
                        </RouteLink>
                    </div>
                )}

                <Space direction="vertical">
                    <Button type="primary" size="large" block form="editor-product">Сохранить</Button>
                    <Button icon={<DropboxOutlined />} size="large" block>Добавить в архив</Button>
                </Space>
            </Card>
        </div>
    )
}

export default LeftSidebar
