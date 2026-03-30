import type {ThemeConfig} from "antd/es/config-provider/context"

export const themes: Record<string, ThemeConfig> = {
    light: {
        token: {
            fontFamily: "Averta CY, sans-serif",
            colorPrimary: "#B1E81C",
            borderRadius: 12,
            colorText: "#363A42",
            colorTextSecondary: "#B0B3B9",
            borderRadiusLG: 12,
            colorBorder: "#E8EBEF",
            colorBgBase: "#F6F8FB",
            colorBgLayout: "#EEF3F8",
            colorBgContainer: "#FFFFFF",
            colorBgElevated: "#FFFFFF"
        },
        components: {
            Layout: {
                headerBg: "#fff",
                bodyBg: "#EEF3F8",
                footerBg: "transparent"
            },
            Segmented: {
                itemSelectedBg: "#B1E81C",
                itemSelectedColor: "#1E2127",
                trackBg: "#FAFAFB"
            },
            Button: {
                primaryColor: "#363A42"
            },
            Form: {
                verticalLabelPadding: "0"
            },
            Switch: {
                handleBg: "#363A42"
            },
            Card: {
                colorBgContainer: "#FFFFFF"
            },
            Input: {
                activeBorderColor: "#B1E81C"
            }
        }
    },
    dark: {
        token: {
            fontFamily: "Averta CY, sans-serif",
            colorPrimary: "#C5FF3E",
            borderRadius: 12,
            colorText: "#E8EEF5",
            colorTextSecondary: "#9CA8B8",
            borderRadiusLG: 12,
            colorBorder: "#2E3844",
            colorBgBase: "#0C1017",
            colorBgLayout: "#0F1520",
            colorBgContainer: "#141C29",
            colorBgElevated: "#1A2433"
        },
        components: {
            Layout: {
                headerBg: "rgba(11, 18, 28, 0.78)",
                bodyBg: "#0F1520",
                footerBg: "transparent"
            },
            Segmented: {
                itemSelectedBg: "#C5FF3E",
                itemSelectedColor: "#17202C",
                itemColor: "#B4C0CF",
                trackBg: "#162130"
            },
            Button: {
                primaryColor: "#17202C",
                defaultColor: "#C9D4E0",
                defaultBorderColor: "#334155"
            },
            Form: {
                verticalLabelPadding: "0"
            },
            Switch: {
                handleBg: "#111827",
                colorPrimary: "#7DD3FC"
            },
            Card: {
                colorBgContainer: "rgba(20, 28, 41, 0.85)"
            },
            Table: {
                headerBg: "#1B2737",
                headerColor: "#DDE7F2",
                rowHoverBg: "#1A2534",
                borderColor: "#2A3647"
            },
            Input: {
                colorBgContainer: "#131C2B",
                colorBorder: "#2E3A4D",
                activeBorderColor: "#7DD3FC",
                colorTextPlaceholder: "#6F8298"
            }
        }
    }
}
