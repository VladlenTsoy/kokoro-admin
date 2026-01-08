import React from "react"
import {Button, Card, Divider, Skeleton, Space, Typography} from "antd"
import {LeftOutlined, PlusOutlined} from "@ant-design/icons"
import {Link as RouteLink, useNavigate, useParams} from "react-router-dom"
import {createStyles} from "antd-style"
import NavigationSection from "./navigation-section/NavigationSection.tsx"
import {useGetOthersVariantsByProductByIdQuery} from "../../productApi.ts"

const {Title} = Typography

const useStyles = createStyles(({token}) => ({
    menuOtherVariants: {
        marginTop: "1rem",
        marginBottom: "1rem"
    },
    menuItem: {
        display: "flex",
        fontSize: `${token.fontSizeLG}px`,
        padding: "0.75rem 1.25rem",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out",
        borderRadius: 15,
        alignItems: "center",
        gap: 8,
        color: token.colorText,

        "&:hover": {
            color: token.colorText,
            backgroundColor: "#F8F9F9"
        }
    },
    colorId: {
        color: token.colorTextSecondary
    },
    colorCircle: {
        height: 20,
        width: 20,
        borderRadius: "50%"
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

const LeftSidebar: React.FC = () => {
    const params = useParams<{id: string; color: string}>()
    const {isLoading, data} = useGetOthersVariantsByProductByIdQuery(params.id, {
        refetchOnMountOrArgChange: true,
        skip: !params.id
    })
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
                    <Title level={3} style={{marginBottom: 2}}>{params?.id ? "Редактировать" : "Добавить товар"}</Title>
                </Space>
                <Divider size="small" />
                <NavigationSection />

                {
                    isLoading ?
                        <div className={styles.menuOtherVariants}>
                            <Skeleton title={false} paragraph={{rows: 3, width: "100%"}} />
                        </div> : !params?.color &&
                        data &&
                        <div className={styles.menuOtherVariants}>
                            <Title level={4}>Цвета продукта</Title>
                            {
                                data.map(
                                    (variant) =>
                                        variant.id !== Number(params.id) && (
                                            <RouteLink
                                                replace
                                                key={variant.id}
                                                to={`/products/product/${variant.id}`}
                                                className={styles.menuItem}
                                            >
                                                <div className={styles.colorId}>#{variant.id}</div>
                                                <div className={styles.colorCircle}
                                                     style={{backgroundColor: variant.color.hex}} />
                                                <div>{variant.title} ({variant.color.title})</div>
                                            </RouteLink>
                                        )
                                )
                            }
                        </div>
                }

                {params.id && !params.color && (
                    <RouteLink to={`/products/product/${params.id}/color`}>
                        <Button type="dashed" icon={<PlusOutlined />} size="large" block>
                            Добавить цвет
                        </Button>
                    </RouteLink>
                )}

            </Card>
        </div>
    )
}

export default LeftSidebar
