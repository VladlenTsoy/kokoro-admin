import {Select, Space, Tag, Tooltip, Typography} from "antd"
import {GlobalOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    select: {
        width: 170,
        "& .ant-select-selector": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder
        }
    },
    optionLabel: {
        width: "100%",
        justifyContent: "space-between"
    }
}))

const HeaderLanguage = () => {
    const {styles} = useStyles()

    return (
        <Tooltip title="Админ-панель сейчас доступна на русском. Узбекская и английская версии появятся позже.">
            <Select
                aria-label="Язык интерфейса админ-панели"
                className={styles.select}
                value="ru"
                size="large"
                suffixIcon={<GlobalOutlined />}
                popupMatchSelectWidth={240}
                options={[
                    {value: "ru", label: "Русский"},
                    {
                        value: "uz",
                        disabled: true,
                        label: (
                            <Space className={styles.optionLabel}>
                                <Typography.Text>O'zbekcha</Typography.Text>
                                <Tag color="default">скоро</Tag>
                            </Space>
                        )
                    },
                    {
                        value: "en",
                        disabled: true,
                        label: (
                            <Space className={styles.optionLabel}>
                                <Typography.Text>English</Typography.Text>
                                <Tag color="default">скоро</Tag>
                            </Space>
                        )
                    }
                ]}
            />
        </Tooltip>
    )
}

export default HeaderLanguage
