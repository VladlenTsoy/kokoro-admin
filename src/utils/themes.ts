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
            colorBorder: "#F1F2F4"
        },
        components: {
            Layout: {
                headerBg: "#fff",
                bodyBg: "linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%);"
            },
            Segmented: {
                itemSelectedBg: "#B1E81C",
                // itemSelectedColor: "#fff",
                // itemColor: "#fff",
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
            }
        }
    },
    dark: {
        token: {
            fontFamily: "Averta CY, sans-serif",
            colorPrimary: "#B1E81C",
            borderRadius: 12,
            colorText: "#e6ebed",
            // colorTextSecondary: "#B0B3B9",
            borderRadiusLG: 12,
            colorBorder: "#383f45",
            colorBgContainer: "#292f36",
            colorBgElevated: "#292f36"
        },
        components: {
            Layout: {
                headerBg: "#292f36",
                bodyBg: "#111213"
            },
            Segmented: {
                itemSelectedBg: "#B1E81C",
                itemSelectedColor: "black",
                // itemColor: "black",
                trackBg: "#292f36"
            },
            Button: {
                primaryColor: "#363A42"
            },
            Form: {
                verticalLabelPadding: "0"
            },
            Switch: {
                handleBg: "#363A42"
            }
        }
    }
}