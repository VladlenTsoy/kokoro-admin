import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm} from "antd"
import type {ColumnsType} from "antd/es/table"
import type {CountryType, CityType} from "../../features/settings/country/CountryTypes.ts"
import {
    useGetCountriesQuery,
    useCreateCountryMutation,
    useUpdateCountryMutation,
    useDeleteCountryMutation,
    useCreateCityMutation,
    useUpdateCityMutation,
    useDeleteCityMutation
} from "../../features/settings/country/countryApi.ts"

const CountryCityPage: React.FC = () => {
    const {data: countries, isLoading} = useGetCountriesQuery()
    const [createCountry] = useCreateCountryMutation()
    const [updateCountry] = useUpdateCountryMutation()
    const [deleteCountry] = useDeleteCountryMutation()
    const [createCity] = useCreateCityMutation()
    const [updateCity] = useUpdateCityMutation()
    const [deleteCity] = useDeleteCityMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [modalType, setModalType] = useState<"country" | "city">("country")
    const [form] = Form.useForm()

    const openModal = (type: "country" | "city", item?: any, parentId?: number) => {
        setModalType(type)
        setEditingItem(item ? {...item, parentId} : null)
        if (item) {
            form.setFieldsValue(item)
        } else {
            form.resetFields()
        }
        setIsModalOpen(true)
    }

    const handleOk = async () => {
        const values = await form.validateFields()
        if (modalType === "country") {
            if (editingItem) {
                await updateCountry({id: editingItem.id, ...values})
            } else {
                await createCountry(values)
            }
        } else {
            if (editingItem) {
                await updateCity({id: editingItem.id, ...values})
            } else {
                await createCity({...values, countryId: editingItem?.parentId})
            }
        }
        setIsModalOpen(false)
        form.resetFields()
    }

    const handleDelete = async (type: "country" | "city", id: number) => {
        if (type === "country") {
            await deleteCountry(id)
        } else {
            await deleteCity(id)
        }
    }

    const countryColumns: ColumnsType<CountryType> = [
        {title: "ID", dataIndex: "id", key: "id"},
        {title: "Название", dataIndex: "name", key: "name"},
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button onClick={() => openModal("country", record)}>Редактировать</Button>
                    <Popconfirm
                        title="Удалить страну?"
                        onConfirm={() => handleDelete("country", record.id)}
                    >
                        <Button danger>Удалить</Button>
                    </Popconfirm>
                    <Button onClick={() => openModal("city", null, record.id)}>
                        Добавить город
                    </Button>
                </Space>
            )
        }
    ]

    const expandedRowRender = (country: CountryType) => {
        const cityColumns: ColumnsType<CityType> = [
            {title: "ID", dataIndex: "id", key: "id"},
            {title: "Название", dataIndex: "name", key: "name"},
            {
                title: "Действия",
                key: "actions",
                render: (_, record) => (
                    <Space>
                        <Button onClick={() => openModal("city", record, country.id)}>
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить город?"
                            onConfirm={() => handleDelete("city", record.id)}
                        >
                            <Button danger>Удалить</Button>
                        </Popconfirm>
                    </Space>
                )
            }
        ]

        return (
            <Table
                columns={cityColumns}
                dataSource={country.cities}
                rowKey="id"
                pagination={false}
            />
        )
    }

    return (
        <div>
            <Space style={{marginBottom: 16}}>
                <Button type="primary" onClick={() => openModal("country")}>
                    Добавить страну
                </Button>
            </Space>

            <Table
                columns={countryColumns}
                expandable={{expandedRowRender}}
                dataSource={countries || []}
                rowKey="id"
                loading={isLoading}
            />

            <Modal
                title={
                    editingItem
                        ? `Редактирование ${modalType === "country" ? "страны" : "города"}`
                        : `Создание ${modalType === "country" ? "страны" : "города"}`
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CountryCityPage
