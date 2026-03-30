import {Input} from "antd"
import {SearchOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const {Search} = Input

const useStyles = createStyles(({token}) => ({
    search: {
        width: 280,
        maxWidth: "38vw",
        "& .ant-input-affix-wrapper": {
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorder,
            background: token.colorBgContainer
        }
    }
}))

const HeaderSearch = () => {
    const {styles} = useStyles()

    return (
        <Search
            className={styles.search}
            size="large"
            placeholder="Поиск по сервису..."
            allowClear
            prefix={<SearchOutlined />}
        />
    )
}

export default HeaderSearch
