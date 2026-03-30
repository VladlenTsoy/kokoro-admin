import {Space, Typography} from "antd"
import type {ReactNode} from "react"

interface PageHeadingProps {
    title: string
    subtitle?: string
    extra?: ReactNode
}

const PageHeading = ({title, subtitle, extra}: PageHeadingProps) => {
    return (
        <div style={{display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18}}>
            <div>
                <Typography.Title level={3} style={{margin: 0}}>
                    {title}
                </Typography.Title>
                {subtitle && (
                    <Typography.Text type="secondary">
                        {subtitle}
                    </Typography.Text>
                )}
            </div>
            {extra ? <Space>{extra}</Space> : null}
        </div>
    )
}

export default PageHeading
