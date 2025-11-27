import {Card, Col, DatePicker, Divider, Form, InputNumber, Row, Typography} from "antd"

const {Title} = Typography

const PriceSection = () => {
    return (
        <Card>
            <Title level={3}>Стоимость</Title>
            <Divider size="small" />
            <Row gutter={28}>
                <Col xl={12} md={12} xs={24}>
                    <Form.Item
                        label="Отображаемая стоимость"
                        name="price"
                        rules={[
                            {
                                required: true,
                                message: "Введите отображаемую стоимость!"
                            }
                        ]}
                    >
                        <InputNumber
                            style={{width: "100%"}}
                            min={0}
                            keyboard={false}
                            placeholder="Введите стоимость"
                        />
                    </Form.Item>
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <Form.Item name={["discount", "discount"]} label="Скидка (%)">
                        <InputNumber
                            min={0}
                            max={100}
                            style={{width: "100%"}}
                        />
                    </Form.Item>
                </Col>

                <Col xl={12} md={12} xs={24}>
                    <Form.Item name={["discount", "end_at"]} label="До какого">
                        <DatePicker
                            format="DD-MM-YYYY"
                            style={{width: "100%"}}
                            showToday={false}
                            placeholder="Выберите дату"
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    )
}

export default PriceSection