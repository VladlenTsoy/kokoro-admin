import React, {useState} from "react"
import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
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
    type EditingItem = (CountryType | CityType) & {parentId?: number}
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
    const [modalType, setModalType] = useState<"country" | "city">("country")
    const [form] = Form.useForm()

    const openModal = (type: "country" | "city", item?: CountryType | CityType | null, parentId?: number) => {
        setModalType(type)
        setSelectedCountryId(parentId ?? null)
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
                await updateCity({
                    countryId: editingItem.parentId as number,
                    cityId: editingItem.id,
                    data: values
                })
            } else if (selectedCountryId !== null) {
                await createCity({
                    countryId: selectedCountryId,
                    city: values
                })
            }
        }
        setIsModalOpen(false)
        form.resetFields()
    }

    const handleDelete = async (type: "country" | "city", id: number, parentId?: number) => {
        if (type === "country") {
            await deleteCountry(id)
        } else if (parentId !== undefined) {
            await deleteCity({countryId: parentId, cityId: id})
        }
    }

    const countryColumns: ColumnsType<CountryType> = [
        {
            title: "Страна",
            dataIndex: "name",
            key: "name",
            render: (name: string, record) => (
                <Space orientation="vertical" size={2}>
                    <Typography.Text strong>{name}</Typography.Text>
                    <Typography.Text type="secondary">ID {record.id}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Города",
            key: "cities",
            width: 160,
            render: (_, record) => (
                <Tag color={record.cities?.length ? "blue" : "default"}>
                    {record.cities?.length || 0} городов
                </Tag>
            )
        },
        {
            title: "Действия",
            key: "actions",
            width: 360,
            render: (_, record) => (
                <Space wrap>
                    <Button onClick={() => openModal("country", record)}>Редактировать</Button>
                    <Popconfirm
                        title="Удалить страну?"
                        description="Проверьте, что к стране не привязаны активные города и заказы."
                        onConfirm={() => handleDelete("country", record.id)}
                        okText="Удалить"
                        cancelText="Отмена"
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
            {
                title: "Город",
                dataIndex: "name",
                key: "name",
                render: (name: string, record) => (
                    <Space orientation="vertical" size={2}>
                        <Typography.Text>{name}</Typography.Text>
                        <Typography.Text type="secondary">ID {record.id}</Typography.Text>
                    </Space>
                )
            },
            {
                title: "Действия",
                key: "actions",
                width: 260,
                render: (_, record) => (
                    <Space wrap>
                        <Button onClick={() => openModal("city", record, country.id)}>
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить город?"
                            description="Удаляйте город только если он больше не используется в доставке."
                            onConfirm={() => handleDelete("city", record.id, country.id)}
                            okText="Удалить"
                            cancelText="Отмена"
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
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Города ещё не добавлены. Добавьте город, чтобы менеджеры могли выбрать доставку внутри страны."
                        />
                    )
                }}
                scroll={{x: 520}}
            />
        )
    }

    return (
        <SettingsTableSection
            title="Страны и города"
            subtitle="Справочник географии для доставки и операционных сценариев менеджеров."
            addButtonText="Добавить страну"
            onAdd={() => openModal("country")}
        >
            <Alert
                type="info"
                showIcon
                message="Сначала создайте страну, затем добавьте города внутри раскрытой строки."
                description="Перед удалением проверьте, что география больше не используется в заказах, доставке или настройках филиалов."
                style={{margin: 16}}
            />
            <Table
                columns={countryColumns}
                expandable={{expandedRowRender}}
                dataSource={countries || []}
                rowKey="id"
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Страны ещё не настроены. Добавьте первую страну, чтобы открыть выбор городов для доставки."
                        />
                    )
                }}
                scroll={{x: 760}}
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
                        label={modalType === "country" ? "Название страны" : "Название города"}
                        extra={modalType === "country"
                            ? "Например: Узбекистан. Города добавляются после создания страны."
                            : "Например: Ташкент. Название будет видно менеджерам при работе с доставкой."}
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder={modalType === "country" ? "Введите страну" : "Введите город"} />
                    </Form.Item>
                </Form>
            </Modal>
        </SettingsTableSection>
    )
}

export default CountryCityPage
