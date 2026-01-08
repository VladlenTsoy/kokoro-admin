import {Card, Col, DatePicker, Divider, Form, InputNumber, Row, Switch, Typography} from "antd"
import {createStyles} from "antd-style"
import React from "react"

const {Title} = Typography

const useStyles = createStyles(({token}) => ({
    entAtBlock: {
        padding: "1rem",
        backgroundColor: "#F8F9F9",
        borderRadius: token.borderRadius,
        display: "grid",
        gap: 16,
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center"
    },
    text: {
        lineHeight: 1.25,
        color: token.colorTextSecondary
    },
    wrapDiscount: {
        display: "flex",
        width: "100%",
        position: "relative",
        alignItems: "center",
        gap: "1rem"
    },
    wrapSwitch: {
        position: "absolute",
        right: "1rem",
        top: 48
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
            <Divider size="middle" />
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
                            placeholder="Введите стоимость"
                        />
                    </Form.Item>
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <div className={styles.wrapDiscount}>
                        <Form.Item name={["discount", "percent"]} label="Скидка (%)" style={{width: "100%"}}>
                            <InputNumber
                                min={1}
                                max={100}
                                style={{width: "100%"}}
                                placeholder="Введите скидку"
                                disabled={discountMode}
                            />
                        </Form.Item>
                        <Switch className={styles.wrapSwitch} onChange={onChangeDiscountMode} value={!discountMode} />
                    </div>
                </Col>
                {discountValue &&
                    <Col xl={24} md={24} xs={24}>
                        <div className={styles.entAtBlock}>
                            <div className={styles.text}>
                                Вы можете указать дату, до которой будет действовать скидка. После сохранения она
                                активируется автоматически.
                            </div>
                            <Form.Item name={["discount", "end_at"]} label="До какого">
                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{width: "100%"}}
                                    showToday={false}
                                    placeholder="Выберите дату"
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