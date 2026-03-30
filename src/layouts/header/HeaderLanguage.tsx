import {Select} from "antd"
import {GlobalOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    select: {
        width: 130,
        "& .ant-select-selector": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder
        }
    }
}))

const HeaderLanguage = () => {
    const {styles} = useStyles()

    return (
        <Select
            className={styles.select}
            defaultValue="ru"
            size="large"
            suffixIcon={<GlobalOutlined />}
            options={[
                {value: "ru", label: "Русский"},
                {value: "uz", label: "O'zbekcha"},
                {value: "en", label: "English"}
            ]}
        />
    )
}

export default HeaderLanguage
