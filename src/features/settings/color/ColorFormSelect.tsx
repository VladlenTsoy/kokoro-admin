import {Form, Select} from "antd"
import {useGetColorsQuery} from "./colorApi"

const ColorFormSelect = () => {
    const {isLoading, data: colors} = useGetColorsQuery()

    return (
        <Form.Item label="Цвет" name="color_id" rules={[{required: true, message: "Выберите цвет"}]}>
            <Select
                showSearch
                loading={isLoading}
                placeholder="Выберите цвет"
                optionFilterProp="label"
                options={colors?.map(c => ({
                    value: c.id,
                    label: (
                        <div className="option-color">
                            <div className="color" style={{ background: c.hex }} />
                            {c.title}
                        </div>
                    ),
                    "data-title": c.title
                }))}
            />
        </Form.Item>
    )
}

export default ColorFormSelect