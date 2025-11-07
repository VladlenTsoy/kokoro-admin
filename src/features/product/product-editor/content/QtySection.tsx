import {Row, Col, Divider, Form, InputNumber, Typography, Card} from "antd"
import {Element} from "react-scroll"

const {Title, Text} = Typography

interface SelectedSizeProps {
    selectSizes: {id: number, title: string}[];
}

const SelectedSize: React.FC<SelectedSizeProps> = ({selectSizes}) => {
    return (
        <Card>
            <Element name="qty">
                <Title level={3}>Количество</Title>
                <Text type="secondary">Чтобы активировать поля для ввода информации, необходимо сначала выбрать
                    размеры.</Text>
            </Element>
            {
                selectSizes.map((size) =>
                    <Row gutter={28} key={size.id}>
                        <Col span={24}>
                            <Divider
                                style={{margin: 0, marginBottom: "0.5rem"}}
                                orientation="left"
                            >
                                {size.title}
                            </Divider>
                        </Col>
                        <Col xl={8}>
                            <Form.Item name={["size_props", String(size.id), "id"]} hidden initialValue={size.id}>
                                <InputNumber />
                            </Form.Item>
                            <Form.Item
                                label="Количество"
                                name={["size_props", String(size.id), "qty"]}
                                rules={[
                                    {
                                        required: true,
                                        message: "Введите количество"
                                    }
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    keyboard={false}
                                    placeholder={`Количество ${size.title}`}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={8}>
                            <Form.Item
                                label="Себестоимость"
                                name={["size_props", String(size.id), "cost_price"]}
                                rules={[
                                    {
                                        required: true,
                                        message: "Введите себестоимость!"
                                    }
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    keyboard={false}
                                    placeholder={`Себестоимость ${size.title}`}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={8}>
                            <Form.Item
                                label="Мин. остаток"
                                name={["size_props", String(size.id), "min_qty"]}
                                rules={[
                                    {
                                        required: true,
                                        message: "Введите мин. остаток!"
                                    }
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    keyboard={false}
                                    placeholder={`Мин. остаток ${size.title}`}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )
            }
        </Card>
    )
}
export default SelectedSize