import {Input} from "antd"

const {Search} = Input

const HeaderSearch = () => {
    return (
        <Search size="large" placeholder="Поиск..." style={{width: 200}} />
    )
}

export default HeaderSearch