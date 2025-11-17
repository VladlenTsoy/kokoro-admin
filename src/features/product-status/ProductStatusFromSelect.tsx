import {Form, Select} from "antd"

const ProductStatusFromSelect = () => {
    return (
        <Form.Item
            label="Статус"
            name="status"
            rules={[{required: true, message: "Выберите статус!"}]}
        >
            <Select>
                <Select.Option value="draft">
                    В проекте
                </Select.Option>
                <Select.Option value="published">
                    Опубликованные
                </Select.Option>
                <Select.Option value="">
                    Закончились
                </Select.Option>
                <Select.Option value="">
                    Архив
                </Select.Option>
            </Select>
        </Form.Item>
    )
}

export default ProductStatusFromSelect