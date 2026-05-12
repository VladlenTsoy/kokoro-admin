import {Alert, Card, Col, Divider, Row, Typography} from "antd"
import ProductVariantStatusFromSelect from "../../../product-variant-status/ProductVariantStatusFromSelect.tsx"
import ProductFormCheckboxPanel from "../../../../components/ProductFormCheckboxPanel.tsx"

const {Title} = Typography

const PublicationSection = () => {
    return (
        <Card>
            <Title level={3}>Статус и публикация</Title>
            <Alert
                showIcon
                type="info"
                message="Проверьте видимость товара перед сохранением"
                description="Статус управляет доступностью варианта в витрине, а отметка «Новинка» добавляет маркетинговый бейдж на карточку товара. Перед публикацией проверьте цену, остатки и фото."
                style={{marginBottom: 16}}
            />
            <Divider size="middle" />
            <Row gutter={28}>
                <Col xl={12} md={12} xs={24}>
                    <ProductVariantStatusFromSelect />
                </Col>
                <Col xl={12} md={12} xs={24}></Col>
                <Col xl={12} md={12} xs={24}>
                    <ProductFormCheckboxPanel
                        name="is_new"
                        title={"Новинка"}
                        description={"Показывает бейдж «Новинка» на карточке товара. Используйте для новых поступлений и снимайте после окончания промо-периода, чтобы каталог не вводил покупателей в заблуждение."}
                        activeLabel="Бейдж виден на витрине"
                        inactiveLabel="Бейдж скрыт"
                    />
                </Col>
            </Row>
        </Card>
    )
}

export default PublicationSection