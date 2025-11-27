import {Form, Select} from "antd"
import {useGetColorsQuery} from "./colorApi"
import {createStyles} from "antd-style"

const useStyles = createStyles(({token}) => ({
    optionColor: {
        display: "flex",
        alignItems: "center",
        gap: 8
    },
    color: {
        height: 20,
        width: 20,
        borderRadius: 50,
        boxShadow: token.boxShadowTertiary
    }
}))

const ColorFormSelect = () => {
    const {isLoading, data: colors} = useGetColorsQuery()
    const {styles} = useStyles()

    return (
        <Form.Item label="Цвет" name="color_id" rules={[{required: true, message: "Выберите цвет"}]}>
            <Select
                showSearch
                loading={isLoading}
                placeholder="Выберите цвет"
                optionFilterProp="searchText"
                options={colors?.map(c => ({
                    value: c.id,
                    label: (
                        <div className={styles.optionColor}>
                            <div className={styles.color} style={{ background: c.hex }} />
                            {c.title}
                        </div>
                    ),
                    searchText: c.title
                }))}
            />
        </Form.Item>
    )
}

export default ColorFormSelect