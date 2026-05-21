import {PlusOutlined} from "@ant-design/icons"
import {Alert, Button, Space, Tooltip} from "antd"
import {createStyles} from "antd-style"
import type {ReactNode} from "react"
import PageHeading from "../PageHeading.tsx"

interface SettingsTableSectionProps {
    title: string
    subtitle: string
    addButtonText: string
    onAdd: () => void
    canAdd?: boolean
    addButtonDisabled?: boolean
    addButtonDisabledReason?: ReactNode
    addButtonIcon?: ReactNode
    children: ReactNode
}

const useStyles = createStyles(({token}) => ({
    disabledReason: {
        marginTop: -6
    },
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
    addButtonDisabled = false,
    addButtonDisabledReason,
    addButtonIcon = <PlusOutlined />,
    children
}: SettingsTableSectionProps) => {
    const {styles} = useStyles()
    const addButtonLabel = `${addButtonText}: ${title}`
    const addButton = (
        <Button
            type="primary"
            icon={addButtonIcon}
            onClick={onAdd}
            disabled={addButtonDisabled}
            aria-label={addButtonLabel}
            title={addButtonLabel}
        >
            {addButtonText}
        </Button>
    )
    const addButtonExtra = addButtonDisabled && addButtonDisabledReason ? (
        <Tooltip title={addButtonDisabledReason}>
            <span>{addButton}</span>
        </Tooltip>
    ) : addButton

    return (
        <Space direction="vertical" size={14} style={{width: "100%"}}>
            <PageHeading
                title={title}
                subtitle={subtitle}
                extra={canAdd ? addButtonExtra : null}
            />
            {canAdd && addButtonDisabled && addButtonDisabledReason ? (
                <Alert
                    className={styles.disabledReason}
                    type="info"
                    showIcon
                    message="Действие временно недоступно"
                    description={addButtonDisabledReason}
                />
            ) : null}
            <div className={styles.tableSurface}>
                {children}
            </div>
        </Space>
    )
}

export default SettingsTableSection
