import {Col, Form, type FormProps, Row, type SelectProps} from "antd"
import BaseSection from "./content/BaseSection.tsx"
import PriceSection from "./content/PriceSection.tsx"
import {useCallback, useEffect, useState} from "react"
import QtySection from "./content/QtySection.tsx"
import PublicationSection from "./content/PublicationSection.tsx"
import MeasurementsSection from "./content/MeasurementsSection.tsx"
import LeftBlock from "./left-block/LeftBlock.tsx"
import {Element} from "react-scroll"
import RightBlock from "./right-block/RightBlock.tsx"
import {createStyles} from "antd-style"
import {useCreateProductMutation} from "../productApi.ts"
import type {ProductFormValuesType} from "../ProductType.ts"
import type {ProductTemporaryImageType} from "../../file-uploader/product-image-uploader/ProductImageUploaderType.ts"

const useStyles = createStyles(() => ({
    content: {
        display: "grid",
        gap: 8
    }
}))

const ProductEditor = () => {
    const [form] = Form.useForm()
    const [selectedSizes, setSelectedSizes] = useState<{id: number, title: string}[]>([])
    const [images, setImages] = useState<ProductTemporaryImageType[]>([])
    const [discountMode, setDiscountMode] = useState<boolean>(true)
    const {styles} = useStyles()
    const [create] = useCreateProductMutation()

    const discountValue = Form.useWatch(["discount", "discount"], form) as number | undefined

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

    const onChangeDiscountModeHandler = useCallback((mode: boolean) => {
        setDiscountMode(!mode)
    }, [])

    useEffect(() => {
        if (discountMode) {
            form.resetFields([["discount", "discount"], ["discount", "end_at"]])
        }
    }, [discountMode, form])

    const onFinishHandler: FormProps<ProductFormValuesType>["onFinish"] = (values) => {

        const arr = Object.entries(values.size_props).map(([key, value]) => ({
            key,
            ...value
        }))

        create({
            title: values.title,
            category_id: values.category_id,
            color_id: values.color_id,
            storage_id: values.storage_id,
            productProperties: values.productProperties,
            price: values.price,
            product_sizes: arr,
            is_new: values.is_new === "on",
            product_images: images,
            status_id: values.status_id
        })
    }

    return (
        <Row gutter={18}>
            <Col xl={6} md={6} xs={24}>
                <LeftBlock />
            </Col>
            <Col xl={12} md={12} xs={24}>
                <Form
                    layout="vertical"
                    size="large"
                    form={form}
                    onFinish={onFinishHandler}
                    initialValues={{}}
                    id="editor-product"
                    className={styles.content}
                >
                    <Element name="basic">
                        <BaseSection onSelectSizesChange={onSelectSizesHandler} />
                    </Element>
                    <Element name="price">
                        <PriceSection discountValue={discountValue} discountMode={discountMode}
                                      onChangeDiscountMode={onChangeDiscountModeHandler} />
                    </Element>
                    <Element name="qty">
                        <QtySection selectSizes={selectedSizes} />
                    </Element>
                    <Element name="measurements">
                        <MeasurementsSection selectedSizes={selectedSizes} />
                    </Element>
                    <Element name="status-publishing">
                        <PublicationSection />
                    </Element>
                </Form>
            </Col>
            <Col xl={6} md={6} xs={24}>
                <RightBlock imageUrls={images} setImageUrl={setImages} />
            </Col>
        </Row>
    )
}

export default ProductEditor