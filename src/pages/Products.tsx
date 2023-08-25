import React from "react"
import HeaderPage from "../layouts/header-page/HeaderPage"
import {useNavigate, useParams} from "react-router-dom"
import {PlusOutlined, SkinOutlined} from "@ant-design/icons"
import Container from "../layouts/container/Container"
import ProductList from "../features/products/ProductsList"
import {Tabs} from "antd"

type StatusType = "all" | "draft" | "published" | "ending" | "archive"

const items = [
    {
        key: "all",
        label: "Все продукты"
    },
    {
        key: "draft",
        label: "В проекте"
    },
    {
        key: "published",
        label: "Опубликованные"
    },
    {
        key: "ending",
        label: "Закончились"
    },
    {
        key: "archive",
        label: "Архив"
    }
]

const Products = () => {
    const params = useParams<{status: StatusType}>()
    const navigate = useNavigate()

    // Смена статусов
    const onChangeHandler = (status: string) => navigate({pathname: `/products/${status}`})

    return (
        <>
            <HeaderPage
                title="Товары"
                action={[
                    {
                        type: "primary",
                        link: "/products/product/create",
                        icon: <PlusOutlined />,
                        text: "Добавить"
                    }
                ]}
                icon={<SkinOutlined />}
                tabs
            />
            <Tabs activeKey={params.status} items={items} onChange={onChangeHandler} />
            <Container>
                <ProductList />
            </Container>
        </>
    )
}

export default Products
