import {Space, Typography} from "antd"
import {createStyles} from "antd-style"
import type {ReactNode} from "react"

interface PageHeadingProps {
    title: string
    subtitle?: string
    extra?: ReactNode
}

const useStyles = createStyles(({token, css}) => ({
    root: css`
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;

        @media (max-width: ${token.screenSM}px) {
            flex-direction: column;
            gap: 12px;
        }
    `,
    copy: {
        minWidth: 0
    },
    title: {
        margin: 0
    },
    extra: css`
        flex-shrink: 0;
        justify-content: flex-end;

        @media (max-width: ${token.screenSM}px) {
            width: 100%;
            justify-content: stretch;

            .ant-space-item {
                flex: 1 1 180px;
            }

            .ant-btn,
            .ant-input-search,
            .ant-select,
            .ant-picker {
                width: 100%;
            }
        }
    `
}))

const PageHeading = ({title, subtitle, extra}: PageHeadingProps) => {
    const {styles} = useStyles()

    return (
        <div className={styles.root}>
            <div className={styles.copy}>
                <Typography.Title level={3} className={styles.title}>
                    {title}
                </Typography.Title>
                {subtitle && (
                    <Typography.Text type="secondary">
                        {subtitle}
                    </Typography.Text>
                )}
            </div>
            {extra ? <Space className={styles.extra} wrap>{extra}</Space> : null}
        </div>
    )
}

export default PageHeading
