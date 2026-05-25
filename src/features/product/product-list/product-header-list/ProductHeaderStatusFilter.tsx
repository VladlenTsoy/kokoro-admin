import {ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Segmented, Skeleton, Space, Tag, Typography} from "antd"
import {useGetProductVariantStatusesQuery} from "../../../product-variant-status/productVariantStatusApi.ts"
import {createStyles} from "antd-style"
import {useNavigate} from "react-router-dom"
import React, {useMemo} from "react"

const useStyles = createStyles(({token}) => ({
    segmented: {
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
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
        },
        "&::-webkit-scrollbar": {
            display: "none"
        }
    },
    recoveryAlert: {
        maxWidth: 720,
        borderRadius: token.borderRadiusLG,
        "@media (max-width: 960px)": {
            width: "100%"
        }
    }
}))

interface Props {
    defaultSelected: number
}

const ProductHeaderStatusFilter:React.FC<Props> = ({defaultSelected}) => {
    const {isLoading, isError, data, refetch} = useGetProductVariantStatusesQuery(undefined, {refetchOnMountOrArgChange: true})
    const {styles} = useStyles()
    const navigate = useNavigate()
    const statusOptions = useMemo(() => (
        [...(data ?? [])]
            .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
            .map((val) => ({
                label: (
                    <Space size={6} wrap>
                        <Typography.Text>{val.title}</Typography.Text>
                        {val.is_default && <Tag color="blue">по умолчанию</Tag>}
                    </Space>
                ),
                value: val.id
            }))
    ), [data])

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

    if (isError)
        return (
            <Alert
                className={styles.recoveryAlert}
                type="warning"
                showIcon
                message="Статусы каталога временно не загрузились"
                description="Показываем общий список товаров. Повторите загрузку перед массовой проверкой публикации, остатков или скидок."
                action={(
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
                        Повторить
                    </Button>
                )}
            />
        )

    if (!(data && data?.length > 0))
        return (
            <Alert
                className={styles.recoveryAlert}
                type="info"
                showIcon
                message="Статусы товаров ещё не настроены"
                description="Фильтр по SKU-статусам появится после настройки жизненного цикла вариантов. Пока менеджер видит весь каталог."
            />
        )

    return (
        <Segmented
            className={styles.segmented}
            onChange={onChangeSegment}
            value={defaultSelected || 0}
            options={[
                {
                    label: "Все продукты",
                    value: 0
                },
                ...statusOptions
            ]}
        />
    )
}

export default ProductHeaderStatusFilter
