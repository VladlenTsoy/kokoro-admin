import {Form, Select} from "antd"
import React from "react"
import {useGetSalesPointsWithStoragesQuery} from "./salesPointApi.ts"

const {OptGroup, Option} = Select

const ProductStoragesFormSelect: React.FC = () => {
    const {data, isLoading} = useGetSalesPointsWithStoragesQuery()

    return (
        <Form.Item
            label="Место хранения"
            name="storage_id"
        >
            <Select
                showSearch
                loading={isLoading}
                placeholder="Добавить место хранения"
                optionFilterProp="label"
            >
                {data &&
                    data?.map(salesPoint => (
                        <OptGroup key={salesPoint.id} label={salesPoint.title}>
                            {salesPoint?.product_storages?.map(storage => (
                                <Option
                                    value={storage.id}
                                    key={`storage-${storage.id}`}
                                    label={storage.title}
                                >
                                    {storage.title}
                                </Option>
                            ))}
                        </OptGroup>
                    ))}
            </Select>
        </Form.Item>
    )
}
export default React.memo(ProductStoragesFormSelect)