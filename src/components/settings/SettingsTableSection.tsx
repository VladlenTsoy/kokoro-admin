import {Button, Card, Space} from "antd"
import type {ReactNode} from "react"
import PageHeading from "../PageHeading.tsx"

interface SettingsTableSectionProps {
    title: string
    subtitle: string
    addButtonText: string
    onAdd: () => void
    children: ReactNode
}

const SettingsTableSection = ({
    title,
    subtitle,
    addButtonText,
    onAdd,
    children
}: SettingsTableSectionProps) => {
    return (
        <Space direction="vertical" size={14} style={{width: "100%"}}>
            <PageHeading
                title={title}
                subtitle={subtitle}
                extra={(
                    <Button type="primary" onClick={onAdd}>
                        {addButtonText}
                    </Button>
                )}
            />
            <Card>
                {children}
            </Card>
        </Space>
    )
}

export default SettingsTableSection
