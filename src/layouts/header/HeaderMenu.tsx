import {Segmented} from "antd"
import {
    HomeOutlined,
    SearchOutlined,
    ShoppingOutlined,
    SkinOutlined,
    TeamOutlined
} from "@ant-design/icons"
import {createStyles} from "antd-style"
import {useLocation, useNavigate} from "react-router-dom"
import LogoBlack from "../../assets/images/logo_black.svg"
import LogoWhite from "../../assets/images/logo_white.svg"
import {useMemo, type ReactNode} from "react"
import {useSelectedTheme} from "../../features/theme/themeSlice.ts"
import {useSelectedAuthData} from "../../features/auth/authSlice.ts"
import {can} from "../../features/auth/permissions.ts"
import type {PermissionCode} from "../../features/auth/authTypes.ts"

const useStyles = createStyles(() => ({
    root: {
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        width: "100%",
        gap: 14,
        "@media (max-width: 760px)": {
            alignItems: "stretch",
            flexDirection: "column"
        }
    },
    headerLogo: {
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0
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
        overflowX: "auto",
        scrollbarWidth: "none",
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
        },
        "&::-webkit-scrollbar": {
            display: "none"
        }
    }
}))

const HeaderMenu = () => {
    const {styles} = useStyles()
    const navigate = useNavigate()
    const {pathname} = useLocation()
    const mode = useSelectedTheme()
    const {employee} = useSelectedAuthData()
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
        const items: Array<{label: string; value: string; icon: ReactNode; permission: PermissionCode}> = [
            {label: "Главная", value: "/", icon: <HomeOutlined />, permission: "dashboard.read"},
            {label: "Заказы", value: "/orders", icon: <ShoppingOutlined />, permission: "orders.read"},
            {label: "Одежда", value: "/products", icon: <SkinOutlined />, permission: "catalog.read"},
            {label: "Поиск", value: "/search-zero-results", icon: <SearchOutlined />, permission: "catalog.read"},
            {label: "Клиенты", value: "/clients", icon: <TeamOutlined />, permission: "clients.read"}
        ]

        return items.filter((item) => can(employee?.permissions, item.permission))
    }, [employee?.permissions])

    const selectedValue = useMemo(() => {
        const values = options.map((option) => option.value)
        return values.includes(pathValue) ? pathValue : undefined
    }, [options, pathValue])

    return (
        <div className={styles.root}>
            <div className={styles.headerLogo}>
                <img className={styles.headerLogoImage} src={logoSrc} alt="KOKORO" />
            </div>
            <Segmented
                className={styles.segmented}
                options={options}
                value={selectedValue}
                onChange={(value) => navigate(value)}
            />
        </div>
    )
}

export default HeaderMenu
