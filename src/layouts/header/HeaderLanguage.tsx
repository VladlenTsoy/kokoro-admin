import {Select, Tooltip} from "antd"
import {GlobalOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    select: {
        width: 170,
        "& .ant-select-selector": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder
        }
    }
}))

const HeaderLanguage = () => {
    const {styles} = useStyles()

    return (
        <Tooltip title="Интерфейс админки сейчас доступен на русском. Переводы можно будет включить после подготовки контента.">
            <Select
                className={styles.select}
                value="ru"
                size="large"
                aria-label="Язык интерфейса админки — русский"
                suffixIcon={<GlobalOutlined />}
                popupMatchSelectWidth={220}
                options={[
                    {value: "ru", label: "Русский"},
                    {value: "uz", label: "O'zbekcha — скоро", disabled: true},
                    {value: "en", label: "English — soon", disabled: true}
                ]}
            />
        </Tooltip>
    )
}

export default HeaderLanguage
