import {Segmented} from "antd"
import {
    HomeOutlined,
    ShoppingOutlined,
    SkinOutlined,
    TeamOutlined
} from "@ant-design/icons"
import {createStyles} from "antd-style"
import {useLocation, useNavigate} from "react-router-dom"
import LogoBlack from "../../assets/images/logo_black.svg"
import LogoWhite from "../../assets/images/logo_white.svg"
import {useMemo} from "react"
import {useSelectedTheme} from "../../features/theme/themeSlice.ts"

const useStyles = createStyles(() => ({
    headerLogo: {
        display: "inline-flex",
        alignItems: "center",
        marginInlineEnd: 14
    },
    headerLogoImage: {
        display: "flex",
        height: 26,
        width: 98,
        objectFit: "contain"
    },
    segmented: {
        width: "fit-content",
        maxWidth: "100%",
        flex: "0 0 auto",
        "& .ant-segmented-group": {
            gap: 6
        },
        "& .ant-segmented-item": {
            borderRadius: 12,
            transition: "all .2s ease"
        },
        "& .ant-segmented-item-label": {
            padding: "8px 14px",
            margin: "0 2px",
            whiteSpace: "nowrap"
        },
        ".ant-segmented-thumb": {
            borderRadius: 12
        }
    }
}))

const HeaderMenu = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()
    const {pathname} = useLocation()
    const mode = useSelectedTheme()
    const logoSrc = mode === "dark" ? LogoWhite : LogoBlack
    const pathValue = useMemo(() => {
        try {
            const arr = pathname.split("/").filter((val) => val !== "")
            return `/${arr[0] ?? ""}`
        } catch {
            return ""
        }
    }, [pathname])

    const options = useMemo(() => {
        return [
            {label: "Главная", value: "/", icon: <HomeOutlined />},
            {label: "Заказы", value: "/orders", icon: <ShoppingOutlined />},
            {label: "Одежда", value: "/products", icon: <SkinOutlined />},
            {label: "Клиенты", value: "/clients", icon: <TeamOutlined />}
        ]
    }, [])

    const selectedValue = useMemo(() => {
        const values = options.map((option) => option.value)
        return values.includes(pathValue) ? pathValue : undefined
    }, [options, pathValue])

    return (
        <>
            <div className={styles.headerLogo}>
                <img className={styles.headerLogoImage} src={logoSrc} alt="KOKORO" />
            </div>
            <Segmented
                className={styles.segmented}
                options={options}
                value={selectedValue}
                onChange={(value) => navigate(value)}
            />
        </>
    )
}

export default HeaderMenu
