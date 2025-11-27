import ProductInfoIcon from "../../../../../components/icons/ProductInfoIcon.tsx"
import ProductPriceIcon from "../../../../../components/icons/ProductPriceIcon.tsx"
import ProductQtyIcon from "../../../../../components/icons/ProductQtyIcon.tsx"
import ProductMeasurementsIcon from "../../../../../components/icons/ProductMeasurementsIcon.tsx"
import ProductStatusIcon from "../../../../../components/icons/ProductStatusIcon.tsx"
import {Link} from "react-scroll"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    menu: {
        display: "grid",
        gap: 4
    },
    menuItem: {
        display: "flex",
        fontSize: `${token.fontSizeLG}px`,
        padding: "0.75rem 1.25rem",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out",
        color: token.colorTextSecondary,
        borderRadius: 15,
        alignItems: "center",
        gap: 8,

        "&:hover": {
            color: token.colorText,
            backgroundColor: "#F8F9F9"
        }
    },
    active: {
        color: token.colorText,
        backgroundColor: "#F8F9F9"
    }
}))

const Items = [
    {id: "basic", name: "Основная информация", icon: <ProductInfoIcon />},
    {id: "price", name: "Стоимость", icon: <ProductPriceIcon />},
    {id: "qty", name: "Количество", icon: <ProductQtyIcon />},
    {id: "photos", name: "Фотографии", icon: <ProductInfoIcon />},
    {id: "measurements", name: "Свойства & Обмеры", icon: <ProductMeasurementsIcon />},
    {id: "status-publishing", name: "Статус & Публикация", icon: <ProductStatusIcon />}
]

const NavigationSection = () => {
    const {styles} = useStyles()

    return (
        <nav className={styles.menu}>
            {Items.map((item) => (
                <Link
                    activeClass={`${styles.active} active`}
                    className={`${styles.menuItem} menu-item`}
                    to={item.id}
                    key={item.id}
                    spy
                    hashSpy
                    smooth
                    offset={-5}
                    duration={300}
                    htmlFor={item.id}
                >
                    {item.icon}
                    {item.name}
                </Link>
            ))}
        </nav>

    )
}

export default NavigationSection