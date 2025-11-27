import {Menu} from "antd"
import {Outlet, useLocation, useNavigate} from "react-router-dom"
import type {MenuProps} from "antd"

const items: MenuProps["items"] = [
    {
        key: "product",
        label: "Продукт",
        type: "group",
        children: [
            {
                key: "product-categories",
                label: "Категории"
            },
            {
                key: "sizes",
                label: "Размеры"
            },
            {
                key: "colors",
                label: "Цвета"
            },
            {
                key: "product-variant-statuses",
                label: "Статусы"
            }
        ]
    },
    {
        key: "delivery",
        label: "Доставка",
        type: "group",
        children: [
            {
                key: "countries",
                label: "Страны и города"
            }
        ]
    },
    {
        key: "branch",
        label: "Филиал",
        type: "group",
        children: [
            {
                key: "sales-points",
                label: "Точки продаж"
            },
            {
                key: "product-storages",
                label: "Склады"
            }
        ]
    },
    {
        key: "order",
        label: "Заказ",
        type: "group",
        children: [
            {
                key: "sources",
                label: "Источник"
            }
        ]
    }
]

const SettingsLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // Определяем текущий активный ключ из pathname
    // /settings/sizes → sizes
    const selectedKey = location.pathname.split("/")[2]

    const onClickHandler: MenuProps["onClick"] = (e) => {
        navigate(`/settings/${e.key}`)
    }

    return (
        <div style={{display: "flex"}}>
            <Menu
                onClick={onClickHandler}
                style={{width: 256}}
                mode="inline"
                items={items}
                selectedKeys={[selectedKey]}
            />
            <div style={{flex: 1, padding: "16px"}}>
                <Outlet />
            </div>
        </div>
    )
}

export default SettingsLayout