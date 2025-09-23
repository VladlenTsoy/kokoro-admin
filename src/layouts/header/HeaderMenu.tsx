import {Segmented} from "antd"
import {HomeOutlined, ShoppingOutlined, SkinOutlined, TeamOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"
import LogoImage from "../../assets/images/logo_black.svg"

const useStyles = createStyles(() => ({
    headerLogo: {
        display: "inline-block",
        marginInlineEnd: 32
    },
    headerLogoImage: {
        display: "flex",
        height: 32,
        width: 120
    },
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

const HeaderMenu = () => {
    const {styles} = useStyles()

    return (
        <>
            <div className={styles.headerLogo}>
                <img className={styles.headerLogoImage} src={LogoImage} alt="KOKORO" />
            </div>
            <Segmented
                className={styles.segmented}
                options={[
                    {label: "Главная", value: "/", icon: <HomeOutlined />},
                    {label: "Заказы", value: "/orders", icon: <ShoppingOutlined />},
                    {label: "Одежда", value: "/products", icon: <SkinOutlined />},
                    {label: "Клиенты", value: "/clients", icon: <TeamOutlined />}
                ]}
                onChange={(value) => {
                    console.log(value)
                }}
            />
        </>
    )
}

export default HeaderMenu