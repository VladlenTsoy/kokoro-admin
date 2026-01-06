import {Col, Form, type FormProps, Row, type SelectProps} from "antd"
import BaseSection from "./content/BaseSection.tsx"
import PriceSection from "./content/PriceSection.tsx"
import QtySection from "./content/QtySection.tsx"
import PublicationSection from "./content/PublicationSection.tsx"
import MeasurementsSection from "./content/MeasurementsSection.tsx"
import LeftBlock from "./left-block/LeftBlock.tsx"
import RightBlock from "./right-block/RightBlock.tsx"
import {Element} from "react-scroll"
import {createStyles} from "antd-style"
import {useCreateProductMutation, useGetProductByIdQuery} from "../productApi.ts"
import type {ProductFormValuesType, ProductSizeMapType} from "../ProductType.ts"
import type {ProductTemporaryImageType} from "../../file-uploader/product-image-uploader/ProductImageUploaderType.ts"
import {useCallback, useEffect, useMemo, useState} from "react"
import {domainUrlForImage} from "../../../utils/appApiConfig.ts"

const useStyles = createStyles(() => ({
    content: {
        display: "grid",
        gap: 8
    }
}))

interface Props {
    productId?: string
}

const ProductEditor: React.FC<Props> = ({productId}) => {
    const [form] = Form.useForm<ProductFormValuesType>()
    const {data, isLoading} = useGetProductByIdQuery(productId, {
        refetchOnMountOrArgChange: true,
        skip: !productId
    })
    const [create] = useCreateProductMutation()
    const {styles} = useStyles()

    // ---------- Состояния ----------
    const [selectedSizes, setSelectedSizes] = useState<{id: number; title: string}[]>([])
    const [images, setImages] = useState<ProductTemporaryImageType[]>([])
    const [discountMode, setDiscountMode] = useState(true)

    const sizePropsToInitialValues: ProductSizeMapType = useMemo(() => {
        if (!data) return {}

        return data.sizes.reduce<ProductSizeMapType>((acc, item) => {
            const sizeId = item.size?.id ?? 0

            acc[String(sizeId)] = {
                size_id: sizeId,
                qty: item.qty ?? 0,
                cost_price: item.cost_price ?? 0,
                min_qty: item.min_qty ?? 0
            }

            return acc
        }, {})
    }, [data])


    // Инициализация состояния после загрузки данных
    useEffect(() => {
        if (data) {

            const images: ProductTemporaryImageType[] = data.images.map((img) => ({
                id: img.id,
                name: img.name,
                size: img.size,
                position: img.position,
                loading: false,
                key: img.name,
                path: `${domainUrlForImage}${img.path}`
            }))

            setImages(data.images ? images : [])
            setSelectedSizes(data.sizes.map((s) => s.size))

            form.setFieldsValue({
                title: data.title,
                category_id: data.product.category_id,
                color_id: data.color_id,
                price: data.price,
                status_id: data.status_id,
                storage_id: data.storage_id,
                is_new: data.is_new ? "on" : "off",
                size_ids: data.sizes.map((s) => s.size.id),
                size_props: sizePropsToInitialValues
            })
        }
    }, [data, form, sizePropsToInitialValues])

    // ---------- Watchers ----------
    const discountValue = Form.useWatch(["discount", "discount"], form) as number | undefined

    // ---------- Handlers ----------
    const onSelectSizesHandler = useCallback<NonNullable<SelectProps<number[]>["onChange"]>>(
        (value, option) => {
            if (!value || value.length === 0) return

            if (Array.isArray(option) && option.length) {
                const sortedOptions = [...option].sort((a, b) => Number(a.value) - Number(b.value))
                setSelectedSizes(
                    sortedOptions.map((o) => ({
                        id: Number(o.value),
                        title: String(o.label ?? o.value)
                    }))
                )
            }
        },
        []
    )

    const onChangeDiscountModeHandler = useCallback((mode: boolean) => {
        setDiscountMode(!mode)
    }, [])

    // Сброс полей скидки при выключении
    useEffect(() => {
        if (discountMode) {
            form.resetFields([["discount", "discount"], ["discount", "end_at"]])
        }
    }, [discountMode, form])

    // ---------- Submit ----------
    const onFinishHandler: FormProps<ProductFormValuesType>["onFinish"] = useCallback((values: ProductFormValuesType) => {
            const product_sizes = Object.entries(values.size_props ?? {})
                .map(([key, value]) => ({key, ...value}))

            create({
                title: values.title,
                category_id: values.category_id,
                color_id: values.color_id,
                storage_id: values.storage_id,
                productProperties: values.productProperties,
                price: values.price,
                product_sizes,
                is_new: values.is_new === "on",
                product_images: images,
                status_id: values.status_id
            })
        },
        [create, images]
    )

    // ---------- Memoized Left/Right blocks ----------
    const leftBlock = useMemo(() => <LeftBlock />, [])
    const rightBlock = useMemo(() => <RightBlock imageUrls={images} setImageUrl={setImages} />, [images])

    // ---------- Render ----------
    return (
        <Row gutter={18}>
            <Col xl={6} md={6} xs={24}>
                {leftBlock}
            </Col>
            <Col xl={12} md={12} xs={24}>
                <Form
                    layout="vertical"
                    size="large"
                    form={form}
                    onFinish={onFinishHandler}
                    id="editor-product"
                    className={styles.content}
                    disabled={isLoading}
                >
                    <Element name="basic">
                        <BaseSection onSelectSizesChange={onSelectSizesHandler} />
                    </Element>
                    <Element name="price">
                        <PriceSection
                            discountValue={discountValue}
                            discountMode={discountMode}
                            onChangeDiscountMode={onChangeDiscountModeHandler}
                        />
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
                {rightBlock}
            </Col>
        </Row>
    )
}

export default ProductEditor