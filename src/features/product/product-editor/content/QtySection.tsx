import {Alert, Card, Col, Divider, Empty, Form, InputNumber, Row, Typography} from "antd"
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
                Заполните остатки по каждому выбранному размеру, чтобы менеджеры видели доступность товара и не продавали позиции ниже безопасного минимума.
            </Text>
            <Divider size="middle" />
            {
                selectSizes.length <= 0 &&
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Размеры ещё не выбраны"
                >
                    <Text type="secondary">
                        Выберите размеры в блоке «Основная информация» — после этого здесь появятся поля количества, себестоимости и минимального остатка.
                    </Text>
                </Empty>
            }
            {
                selectSizes.length > 0 &&
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Проверьте минимальный остаток перед публикацией"
                    description="Если фактический остаток опустится до минимума, менеджеру будет проще заранее пополнить склад или скрыть размер с витрины."
                />
            }
            {
                selectSizes.map((size) =>
                    <Row gutter={[28, 8]} key={size.id} style={{marginBottom: 12}}>
                        <Col span={24}>
                            <Title level={5} style={{marginBottom: 0}}>{size.title}</Title>
                        </Col>
                        <Col xl={8} md={8} xs={24}>
                            <Form.Item name={["size_props", String(size.id), "id"]} hidden>
                                <InputNumber />
                            </Form.Item>
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
                        <Col xl={8} md={8} xs={24}>
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
                        <Col xl={8} md={8} xs={24}>
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