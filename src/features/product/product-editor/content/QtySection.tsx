import {Card, Col, Divider, Form, InputNumber, Row, Typography, Empty} from "antd"
import React from "react"

const {Title, Text} = Typography

interface SelectedSizeProps {
    selectSizes: {id: number, title: string}[];
}

const SelectedSize: React.FC<SelectedSizeProps> = ({selectSizes}) => {
    return (
        <Card>
            <Title level={3} style={{marginBottom: ".5rem"}}>Количество</Title>
            <Text type="secondary">
            </Text>
            <Divider size="middle" />
            {
                selectSizes.length <= 0 &&
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Чтобы активировать поля для ввода информации, необходимо сначала выбрать размеры."
                />
            }
            {
                selectSizes.map((size) =>
                    <Row gutter={28} key={size.id}>
                        <Col span={24}>
                            <Title level={5} style={{marginBottom: 0}}>{size.title}</Title>
                        </Col>
                        <Col xl={8}>
                            <Form.Item name={["size_props", String(size.id), "size_id"]} hidden initialValue={size.id}>
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