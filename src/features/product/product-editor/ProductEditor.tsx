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
import {useCreateProductMutation, useGetProductByIdQuery, useUpdateProductMutation} from "../productApi.ts"
import type {ProductFormValuesType, ProductSizeMapType} from "../ProductType.ts"
import type {ProductTemporaryImageType} from "../../file-uploader/product-image-uploader/ProductImageUploaderType.ts"
import {useCallback, useEffect, useMemo, useState} from "react"
import dayjs from "dayjs"
import type {CreateProductType} from "../CreateProductType.ts"
import {domainUrlForImage} from "../../../utils/appApiConfig.ts"

const useStyles = createStyles(() => ({
    content: {
        display: "grid",
        gap: 8
    }
}))

interface Props {
    productId?: string
    isColor?: boolean
}

const ProductEditor: React.FC<Props> = ({productId, isColor}) => {
    const [form] = Form.useForm<ProductFormValuesType>()
    const {data, isLoading} = useGetProductByIdQuery(productId, {
        refetchOnMountOrArgChange: true,
        refetchOnReconnect: true,
        refetchOnFocus: true,
        skip: !productId
    })
    const [create] = useCreateProductMutation()
    const [update] = useUpdateProductMutation()
    const {styles} = useStyles()

    // ---------- Состояния ----------
    const [selectedSizes, setSelectedSizes] = useState<{id: number; title: string}[]>([])
    const [images, setImages] = useState<ProductTemporaryImageType[]>([])
    const [discountMode, setDiscountMode] = useState(false)

    const parentProductId = useMemo(() => data?.product?.id, [data])

    const sizePropsToInitialValues: ProductSizeMapType = useMemo(() => {
        if (!data) return {}

        return data.sizes.reduce<ProductSizeMapType>((acc, item) => {
            const sizeId = item.size?.id ?? 0

            acc[String(sizeId)] = {
                ...(isColor ? {} : {id: item.id}),
                size_id: sizeId,
                qty: item.qty ?? 0,
                cost_price: item.cost_price ?? 0,
                min_qty: item.min_qty ?? 0
            }

            return acc
        }, {})
    }, [data, isColor])


    // Инициализация состояния после загрузки данных
    useEffect(() => {
        if (data) {
            if (isColor) {
                const productProperties = data.product?.properties?.map(property => property.id) || []
                setSelectedSizes(data.sizes.map((s) => s.size))
                setDiscountMode(true)

                form.setFieldsValue({
                    product_id: data.product_id,
                    category_id: data.product.category_id,
                    price: data.price,
                    product_properties: productProperties,
                    size_ids: data.sizes.map((s) => s.size.id),
                    size_props: sizePropsToInitialValues,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    measurements: data.measurements.map(({id, ...rest}) => rest)
                })

            } else {
                const images: ProductTemporaryImageType[] = data.images.map((img, index) => ({
                    id: img.id,
                    tmp_id: img.id,
                    name: img.name,
                    size: img.size,
                    position: index + 1,
                    loading: false,
                    path: img.path,
                    url: `${domainUrlForImage}${img.path}`
                }))

                const productProperties = data.product?.properties?.map(property => property.id) || []

                setImages(data.images ? images : [])
                setSelectedSizes(data.sizes.map((s) => s.size))
                setDiscountMode(!data?.discount?.discountPercent)

                form.setFieldsValue({
                    title: data.title,
                    category_id: data.product.category_id,
                    color_id: data.color_id,
                    price: data.price,
                    discount: {
                        percent: data?.discount?.discountPercent,
                        end_at: data?.discount?.endDate
                            ? dayjs(data?.discount?.endDate)
                            : undefined
                    },
                    product_properties: productProperties,
                    status_id: data.status_id,
                    storage_id: data.storage_id,
                    is_new: data.is_new,
                    size_ids: data.sizes.map((s) => s.size.id),
                    size_props: sizePropsToInitialValues,
                    measurements: data.measurements
                })
            }

        } else {
            setDiscountMode(true)
        }
    }, [data, form, isColor, sizePropsToInitialValues])

    // ---------- Watchers ----------
    const discountValue = Form.useWatch(["discount", "percent"], form) as number | undefined

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
            form.resetFields([["discount", "percent"], ["discount", "end_at"]])
        }
    }, [discountMode, form])

    // ---------- Submit ----------
    const onFinishHandler: FormProps<ProductFormValuesType>["onFinish"] = useCallback((values: ProductFormValuesType) => {
            const productSizes: CreateProductType["product_sizes"] = Object.values(values.size_props)
            const productImages: CreateProductType["product_images"] = images.reduce<CreateProductType["product_images"]>((arr, image, index) => {
                if (image.name && image.path && image.size) {
                    return [...arr, {
                        id: image.id,
                        name: image.name,
                        path: image.path,
                        size: image.size,
                        to_delete: image.to_delete,
                        position: index + 1
                    }]
                }
                return arr
            }, [])

            if (productId && !isColor) {
                update({
                    id: +productId,
                    data: {
                        title: values.title,
                        category_id: values.category_id,
                        color_id: values.color_id,
                        storage_id: values.storage_id,
                        product_properties: values.product_properties,
                        price: values.price,
                        discount: {
                            discount_percent: values?.discount?.percent,
                            end_date: values?.discount?.end_at?.toISOString()
                        },
                        product_sizes: productSizes,
                        is_new: values.is_new,
                        product_images: productImages,
                        status_id: values.status_id,
                        measurements: values.measurements
                    }
                })
            } else {
                create({
                    title: values.title,
                    category_id: values.category_id,
                    product_id: isColor ? parentProductId : undefined,
                    color_id: values.color_id,
                    storage_id: values.storage_id,
                    product_properties: values.product_properties,
                    price: values.price,
                    discount: {
                        discount_percent: values?.discount?.percent,
                        end_date: values?.discount?.end_at?.toISOString()
                    },
                    product_sizes: productSizes,
                    is_new: values.is_new,
                    product_images: productImages,
                    status_id: values.status_id,
                    measurements: values.measurements
                })
            }
        },
        [create, images, productId, update, isColor]
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