import {Segmented, Skeleton, Space} from "antd"
import {useGetProductVariantStatusesQuery} from "../../../product-variant-status/productVariantStatusApi.ts"
import {createStyles} from "antd-style"
import {useNavigate} from "react-router-dom"
import React from "react"

const useStyles = createStyles(() => ({
    segmented: {
        "& .ant-segmented-group": {
            gap: 6
        },
        "& .ant-segmented-item": {
            borderRadius: 12
        },
        "& .ant-segmented-item-label": {
            padding: "6px 18px",
            margin: "0 5px"
        },
        ".ant-segmented-thumb": {
            borderRadius: 12
        }
    }
}))

interface Props {
    defaultSelected: number
}

const ProductHeaderStatusFilter:React.FC<Props> = ({defaultSelected}) => {
    const {isLoading, data} = useGetProductVariantStatusesQuery(undefined, {refetchOnMountOrArgChange: true})
    const {styles} = useStyles()
    const navigate = useNavigate()

    const onChangeSegment = (val: number) => {
        if (val === 0) navigate("/products/all")
        else navigate(`/products/${val}`)
    }

    if (isLoading)
        return <Space>
            <Skeleton.Button />
            <Skeleton.Button />
            <Skeleton.Button />
            <Skeleton.Button />
            <Skeleton.Button />
        </Space>

    if (!(data && data?.length > 0))
        return null

    return (
        <Segmented
            className={styles.segmented}
            onChange={onChangeSegment}
            defaultValue={defaultSelected || 0}
            options={
                [
                    {
                        label: "Все продукты",
                        value: 0
                    },
                    ...data.map(val => ({
                        label: val.title,
                        value: val.id
                    }))
                ]
            }
        />
    )
}

export default ProductHeaderStatusFilter