import React from "react"
import {Typography, Row, Col, Form, Input, Card} from "antd"
import {Element} from "react-scroll"
import ProductCategoryFormSelect from "../../../product-category/ProductCategoryFormSelect.tsx"
import ColorFormSelect from "../../../settings/color/ColorFormSelect.tsx"
import ProductStoragesFormSelect from "../../../settings/sales-point/ProductStoragesFormSelect.tsx"
import SizesFormSelect, {type SizesFormSelectProps} from "../../../settings/size/SizesFormSelect.tsx"
import TagsFormSelect from "../../../product-variant-tags/productVariantTagsFormSelect.tsx"

const {Title} = Typography

interface Props {
    onSelectSizesChange: SizesFormSelectProps["onChange"]
}

const BaseSection: React.FC<Props> = ({onSelectSizesChange}) => {
    return (
        <Card>
            <Element name="basic">
                <Title level={3}>Основная информация</Title>
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
                        <TagsFormSelect />
                    </Col>
                </Row>
            </Element>
        </Card>
    )
}

export default BaseSection