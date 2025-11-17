import {Card, Col, Row, Typography} from "antd"
import {Element} from "react-scroll"
import ProductStatusFromSelect from "../../../product-status/ProductStatusFromSelect.tsx"

const {Title} = Typography

const PublicationSection = () => {
    return (
        <Card>
            <Element name="publication">
                <Title level={3}>Основная информация</Title>
                <Row gutter={28}>
                    <Col xl={12} md={12} xs={24}>
                        <ProductStatusFromSelect />
                    </Col>
                </Row>
            </Element>
        </Card>
    )
}

export default PublicationSection