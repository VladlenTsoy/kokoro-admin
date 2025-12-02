import React from "react"
import {Card, Divider, Typography} from "antd"
import ProductPropertyFormCheckbox from "../../../settings/product-property/ProductPropertyFormCheckbox.tsx"
import ProductMeasurementsFormList from "../../../../components/ProductMeasurementsFormList.tsx"

const {Title, Text} = Typography

interface MeasurementsSectionProps {
    selectedSizes: {id: number; title: string}[]
}

const MeasurementsSection: React.FC<MeasurementsSectionProps> = ({selectedSizes}) => {
    return (
        <Card>
            <Title level={3}>Свойства & Обмеры</Title>
            <Divider size="middle" />
            <div style={{marginBottom: 36}}>
                <Title level={4}>Свойства</Title>
                <Text type="secondary" italic>
                    Свойства — это таблица с размерами и параметрами для выбора подходящего варианта.
                </Text>
                <ProductPropertyFormCheckbox />
            </div>
            <div>
                <Title level={4}>Обмеры</Title>
                <Text type="secondary" italic>
                    Обмеры — это таблица с размерами и параметрами для выбора подходящего варианта, включая
                    длину, ширину, высоту и другие измерения.
                </Text>
                <div style={{marginBottom: 12}} />
                <ProductMeasurementsFormList selectedSizes={selectedSizes} />
            </div>
        </Card>
    )
}

export default MeasurementsSection