import {Space, Typography} from "antd"
import {createStyles} from "antd-style"
import type {ReactNode} from "react"

interface PageHeadingProps {
    title: string
    subtitle?: string
    eyebrow?: string
    extra?: ReactNode
}

const useStyles = createStyles(({token, css}) => ({
    root: css`
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 20px;

        @media (max-width: ${token.screenSM}px) {
            flex-direction: column;
            gap: 12px;
        }
    `,
    copy: {
        minWidth: 0,
        maxWidth: 860
    },
    eyebrow: {
        display: "inline-flex",
        marginBottom: 6,
        color: token.colorPrimary,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        lineHeight: 1,
        textTransform: "uppercase"
    },
    title: {
        margin: 0,
        letterSpacing: "-0.025em"
    },
    subtitle: {
        display: "block",
        marginTop: 6,
        maxWidth: 760,
        fontSize: 15,
        lineHeight: 1.55
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

const PageHeading = ({title, subtitle, eyebrow, extra}: PageHeadingProps) => {
    const {styles} = useStyles()

    return (
        <div className={styles.root}>
            <div className={styles.copy}>
                {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
                <Typography.Title level={3} className={styles.title}>
                    {title}
                </Typography.Title>
                {subtitle && (
                    <Typography.Text className={styles.subtitle} type="secondary">
                        {subtitle}
                    </Typography.Text>
                )}
            </div>
            {extra ? <Space className={styles.extra} wrap>{extra}</Space> : null}
        </div>
    )
}

export default PageHeading
