import {Alert, Card, Col, DatePicker, Divider, Form, InputNumber, Row, Switch, Tag, Typography} from "antd"
import {createStyles} from "antd-style"
import React from "react"

const {Paragraph, Text, Title} = Typography

const useStyles = createStyles(({token}) => ({
    entAtBlock: {
        padding: "1rem",
        backgroundColor: "#F8F9F9",
        borderRadius: token.borderRadius,
        display: "grid",
        gap: 16,
        gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 0.7fr)",
        alignItems: "center",
        ["@media (max-width: 768px)"]: {
            gridTemplateColumns: "1fr"
        }
    },
    text: {
        lineHeight: 1.25,
        color: token.colorTextSecondary,
        marginBottom: 0
    },
    guidance: {
        marginBottom: 16
    },
    wrapDiscount: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "end",
        gap: "1rem",
        ["@media (max-width: 576px)"]: {
            gridTemplateColumns: "1fr"
        }
    },
    discountControl: {
        display: "grid",
        gap: 8,
        justifyItems: "end",
        paddingBottom: 24,
        ["@media (max-width: 576px)"]: {
            justifyItems: "start",
            paddingBottom: 0
        }
    }
}))

interface Props {
    discountValue?: number
    discountMode?: boolean
    onChangeDiscountMode: (mode: boolean) => void
}

const PriceSection: React.FC<Props> = ({discountValue, discountMode, onChangeDiscountMode}) => {
    const {styles} = useStyles()

    return (
        <Card>
            <Title level={3}>Стоимость</Title>
            <Paragraph className={styles.text}>
                Проверьте цену перед публикацией: она видна покупателям в каталоге, карточке товара и заказе.
            </Paragraph>
            <Divider size="middle" />
            <Alert
                className={styles.guidance}
                showIcon
                type="info"
                message="Скидка применяется только когда переключатель включён и указан процент"
                description="Если акция временная, добавьте дату окончания — так менеджерам проще не оставить промо-цену активной после кампании."
            />
            <Row gutter={28}>
                <Col xl={12} md={12} xs={24}>
                    <Form.Item
                        label="Отображаемая стоимость"
                        name="price"
                        rules={[
                            {
                                required: true,
                                message: "Введите отображаемую стоимость!"
                            },
                            {
                                type: "number",
                                min: 0,
                                message: "Стоимость не может быть отрицательной"
                            }
                        ]}
                    >
                        <InputNumber
                            style={{width: "100%"}}
                            min={0}
                            placeholder="Например, 249000"
                            addonAfter="сум"
                        />
                    </Form.Item>
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <div className={styles.wrapDiscount}>
                        <Form.Item
                            name={["discount", "percent"]}
                            label="Скидка (%)"
                            style={{width: "100%"}}
                            rules={[
                                {
                                    type: "number",
                                    min: 1,
                                    max: 100,
                                    message: "Укажите скидку от 1 до 100%"
                                }
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={100}
                                style={{width: "100%"}}
                                placeholder="Например, 15"
                                disabled={discountMode}
                                addonAfter="%"
                            />
                        </Form.Item>
                        <div className={styles.discountControl}>
                            <Tag color={discountMode ? "default" : "green"}>{discountMode ? "Скидка выключена" : "Скидка активна"}</Tag>
                            <Switch
                                checked={!discountMode}
                                checkedChildren="Вкл"
                                unCheckedChildren="Выкл"
                                onChange={onChangeDiscountMode}
                            />
                        </div>
                    </div>
                </Col>
                {discountValue &&
                    <Col xl={24} md={24} xs={24}>
                        <div className={styles.entAtBlock}>
                            <Text className={styles.text}>
                                Дата окончания не обязательна, но помогает не забыть выключить акцию после распродажи или
                                рекламной кампании.
                            </Text>
                            <Form.Item name={["discount", "end_at"]} label="Действует до">
                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{width: "100%"}}
                                    showToday={false}
                                    placeholder="Выберите дату окончания"
                                />
                            </Form.Item>
                        </div>
                    </Col>
                }
            </Row>
        </Card>
    )
}

export default PriceSection