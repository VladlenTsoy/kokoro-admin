import {Select} from "antd"

const HeaderLanguage = () => {
    return (
        <Select defaultValue="ru" size="large">
            <Select.Option value="ru">Русский</Select.Option>
        </Select>
    )
}

export default HeaderLanguage