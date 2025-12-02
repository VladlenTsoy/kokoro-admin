import React from "react"
import {Card, Col, Divider, Form, Input, Row, Typography} from "antd"
import ProductCategoryFormSelect from "../../../product-category/ProductCategoryFormSelect.tsx"
import ColorFormSelect from "../../../settings/color/ColorFormSelect.tsx"
import ProductStoragesFormSelect from "../../../settings/sales-point/ProductStoragesFormSelect.tsx"
import SizesFormSelect, {type SizesFormSelectProps} from "../../../settings/size/SizesFormSelect.tsx"
import ProductVariantTagsFormSelect from "../../../product-variant-tags/ProductVariantTagsFormSelect.tsx"

const {Title} = Typography

interface Props {
    onSelectSizesChange: SizesFormSelectProps["onChange"]
}

const BaseSection: React.FC<Props> = ({onSelectSizesChange}) => {
    return (
        <Card>
            <Title level={3}>Основная информация</Title>
            <Divider size="middle" />
            <Row gutter={28}>
                <Col xl={12} md={12} xs={24}>
                    <Form.Item
                        label="Название"
                        name="title"
                        rules={[{required: true, message: "Введите название!"}]}
                    >
                        <Input placeholder="Введите название" />
                    </Form.Item>
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <ProductCategoryFormSelect />
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <ColorFormSelect />
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <ProductStoragesFormSelect />
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <SizesFormSelect onChange={onSelectSizesChange} />
                </Col>
                <Col xl={12} md={12} xs={24}>
                    <ProductVariantTagsFormSelect />
                </Col>
            </Row>
        </Card>
    )
}

export default BaseSection