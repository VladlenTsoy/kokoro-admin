import {Result} from "antd"

const ForbiddenPage = () => {
    return <Result status="403" title="403" subTitle="Недостаточно прав" />
}

export default ForbiddenPage
