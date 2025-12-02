import {Form, Select} from "antd"
import {useGetProductVariantStatusesQuery} from "./productVariantStatusApi.ts"

const ProductVariantStatusFromSelect = () => {
    const {isLoading, data} = useGetProductVariantStatusesQuery()

    return (
        <Form.Item
            label="Статус"
            name="status_id"
            rules={[{required: true, message: "Выберите статус!"}]}
        >
            <Select
                loading={isLoading}
            >
                {data?.map((item) => (
                    <Select.Option value={item.id}>
                        {item.title}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>
    )
}

export default ProductVariantStatusFromSelect