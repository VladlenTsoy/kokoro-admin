import {Row, Col, Form, type SelectProps, type FormProps, Button} from "antd"
import BaseSection from "./content/BaseSection.tsx"
import PriceSection from "./content/PriceSection.tsx"
import {useCallback, useState} from "react"
import QtySection from "./content/QtySection.tsx"
import ImageSection, {type TemporaryImageType} from "./right-block/image-section/ImagesSection.tsx"

type SizePropsMap = Record<
    string,
    {
        id: number;
        qty: number;
        cost_price: number;
        min_qty: number;
    }
>

interface FormValues {
    title: string
    category_id: number
    color_id: number
    storage_id: number
    size_ids: number[]
    tags_id: string[]
    //
    price: number
    discount: {
        discount?: number
        end_at?: string
    }
    //
    size_props: SizePropsMap
}

const ProductEditor = () => {
    const [form] = Form.useForm()
    const [selectedSizes, setSelectedSizes] = useState<{id: number, title: string}[]>([])
    const [images, setImages] = useState<TemporaryImageType[]>([])

    // Выбрать размер
    const onSelectSizesHandler = useCallback<NonNullable<SelectProps<number[]>["onChange"]>>((value, option) => {
        if (!value || value.length === 0) return

        if (Array.isArray(option) && option.length) {
            // Сортируем также option, чтобы порядок соответствовал sortedValues
            const sortedOptions = [...option].sort(
                (a, b) => Number(a.value) - Number(b.value)
            )

            setSelectedSizes(
                sortedOptions.map(o => ({
                    title: String(o.label ?? o.value),
                    id: Number(o.value)
                }))
            )
            return
        }
    }, [setSelectedSizes])

    const onFinishHandler: FormProps<FormValues>["onFinish"] = (values) => {
        console.log(values)
    }

    return (
        <Row gutter={28}>
            <Col span={5}></Col>
            <Col span={14}>
                <Form
                    layout="vertical"
                    size="large"
                    form={form}
                    onFinish={onFinishHandler}
                    initialValues={{status: "draft"}}
                    id="editor-product"
                >
                    <BaseSection onSelectSizesChange={onSelectSizesHandler} />
                    <PriceSection />
                    <QtySection selectSizes={selectedSizes} />
                    <ImageSection imageUrls={images} setImageUrl={setImages} />
                    <Button type="primary" htmlType="submit">Сохранить</Button>
                </Form>
            </Col>
            <Col span={5}>

            </Col>
        </Row>
    )
}

export default ProductEditor