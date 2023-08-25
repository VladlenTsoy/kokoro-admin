import React from "react"
import {Button, Dropdown, Menu, Typography} from "antd"
import {ArrowLeftOutlined, MoreOutlined} from "@ant-design/icons"
import {User} from "../../types/User"
import { ButtonHTMLType, ButtonType } from "antd/es/button"
import { useNavigate } from "react-router-dom"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
    headerPage: {
        margin: '0 auto',
        padding: '.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    back: {
        fontSize: '26px',
        padding: '0 0.5rem 0.5rem 0',
        cursor: 'pointer',
    }
})

interface HeaderPageProps {
    title: string
    linkBack?: string
    icon?: React.ReactNode
    tabs?: boolean
    full?: boolean
    action?: {
        icon: React.ReactNode
        text: string
        link?: string
        type?: ButtonType
        form?: string
        htmlType?: ButtonHTMLType
        loading?: boolean
    }[] | React.ReactNode[]
    more?: {
        icon: React.ReactNode
        text: string
        link?: string
        access?: User["access"][]
    }[]
}

const {Title} = Typography

const HeaderPage: React.FC<HeaderPageProps> = (
    {
        title,
        linkBack,
        action,
        icon,
        tabs,
        full,
        more
    }
) => {
    const navigate = useNavigate()
    const onClickBackHandler = () => (linkBack ? navigate(linkBack) : navigate('/'))
    const styles = useStyles()

    return (
        <div className={styles.headerPage}>
            {icon ? (
                <div className={styles.back}>{icon}</div>
            ) : (
                <div className={styles.back} onClick={onClickBackHandler}>
                    <ArrowLeftOutlined />
                </div>
            )}
            <Title level={1}>{title}</Title>
            {/* {action && <div>
                {action.map((item, key) =>
                    "icon" in item ?
                        <Button
                            key={key}
                            type={item.type}
                            icon={item.icon}
                            htmlType={item.htmlType || "button"}
                            size="large"
                            form={item.form}
                            loading={item.loading}
                            onClick={() => item.link ? history.push(item.link) : null}
                        >
                            {item.text}
                        </Button> : item
                )}
                {more && <Dropdown
                    arrow
                    placement="bottomRight"
                    overlay={
                        <Menu
                            items={
                                more.reduce<any[]>((acc, item, key) => {
                                    if (!item?.access || item?.access?.includes(user?.access || "manager"))
                                        acc.push({
                                            key,
                                            label: item.text,
                                            icon: item.icon,
                                            onClick: () => item.link ? history.push(item.link) : null
                                        })
                                    return acc
                                }, [])
                            }
                        />
                    }
                >
                    <Button size="large" icon={<MoreOutlined />} />
                </Dropdown>}
            </div>} */}
        </div>
    )
}
export default HeaderPage
