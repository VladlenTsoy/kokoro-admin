import {Card, Col, Divider, Row, Typography} from "antd"
import ProductVariantStatusFromSelect from "../../../product-variant-status/ProductVariantStatusFromSelect.tsx"

const {Title} = Typography

const PublicationSection = () => {
    return (
        <Card>
            <Title level={3}>Статус & Публикация</Title>
            <Divider size="small" />
            <Row gutter={28}>
                <Col xl={12} md={12} xs={24}>
                    <ProductVariantStatusFromSelect />
                </Col>
                <Col xl={12} md={12} xs={24}>
                </Col>
                <Col xl={12} md={12} xs={24}>
                </Col>
            </Row>
        </Card>
    )
}

export default PublicationSection