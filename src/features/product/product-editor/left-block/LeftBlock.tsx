import React from "react"
import {Button, Card, Divider, Space, Typography} from "antd"
import {LeftOutlined, PlusOutlined} from "@ant-design/icons"
import {Link as RouteLink, useNavigate, useParams} from "react-router-dom"
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
    const navigate = useNavigate()

    const onClickToBack = () => {
        navigate(-1)
    }

    return (
        <div className={styles.content}>
            <Card>
                <Space size="middle" style={{marginBottom: 2}}>
                    <Button onClick={onClickToBack} shape="circle" icon={<LeftOutlined />} />
                    <Title level={3} style={{marginBottom: 2}}>Добавить товар</Title>
                </Space>
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

            </Card>
        </div>
    )
}

export default LeftSidebar
