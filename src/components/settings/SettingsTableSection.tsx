import {PlusOutlined} from "@ant-design/icons"
import {Button, Space} from "antd"
import {createStyles} from "antd-style"
import type {ReactNode} from "react"
import PageHeading from "../PageHeading.tsx"

interface SettingsTableSectionProps {
    title: string
    subtitle: string
    addButtonText: string
    onAdd: () => void
    canAdd?: boolean
    addButtonIcon?: ReactNode
    children: ReactNode
}

const useStyles = createStyles(({token}) => ({
    tableSurface: {
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        overflow: "hidden"
    }
}))

const SettingsTableSection = ({
    title,
    subtitle,
    addButtonText,
    onAdd,
    canAdd = true,
    addButtonIcon = <PlusOutlined />,
    children
}: SettingsTableSectionProps) => {
    const {styles} = useStyles()

    return (
        <Space orientation="vertical" size={14} style={{width: "100%"}}>
            <PageHeading
                title={title}
                subtitle={subtitle}
                extra={canAdd ? (
                    <Button type="primary" icon={addButtonIcon} onClick={onAdd}>
                        {addButtonText}
                    </Button>
                ) : null}
            />
            <div className={styles.tableSurface}>
                {children}
            </div>
        </Space>
    )
}

export default SettingsTableSection
