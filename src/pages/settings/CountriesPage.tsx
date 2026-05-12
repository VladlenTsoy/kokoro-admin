import React, {useMemo, useState} from "react"
import {Alert, Button, Checkbox, Empty, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import type {CountryType, CityType} from "../../features/settings/country/CountryTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {
    useGetCountriesQuery,
    useCreateCountryMutation,
    useUpdateCountryMutation,
    useDeleteCountryMutation,
    useCreateCityMutation,
    useUpdateCityMutation,
    useDeleteCityMutation
} from "../../features/settings/country/countryApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const formatPosition = (position?: {lat: number; lng: number}) => {
    if (!position) {
        return "Координаты не заданы"
    }

    return `${position.lat}, ${position.lng}`
}

const CountryCityPage: React.FC = () => {
    const {data: countries, isLoading, isError, refetch} = useGetCountriesQuery()
    const [createCountry, {isLoading: isCreatingCountry}] = useCreateCountryMutation()
    const [updateCountry, {isLoading: isUpdatingCountry}] = useUpdateCountryMutation()
    const [deleteCountry, {isLoading: isDeletingCountry}] = useDeleteCountryMutation()
    const [createCity, {isLoading: isCreatingCity}] = useCreateCityMutation()
    const [updateCity, {isLoading: isUpdatingCity}] = useUpdateCityMutation()
    const [deleteCity, {isLoading: isDeletingCity}] = useDeleteCityMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    type EditingItem = (CountryType | CityType) & {parentId?: number}
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
    const [modalType, setModalType] = useState<"country" | "city">("country")
    const [searchQuery, setSearchQuery] = useState("")
    const [showWithoutCitiesOnly, setShowWithoutCitiesOnly] = useState(false)
    const [deletingCountryId, setDeletingCountryId] = useState<number | null>(null)
    const [deletingCityKey, setDeletingCityKey] = useState<string | null>(null)
    const [form] = Form.useForm()

    const sortedCountries = useMemo(
        () => [...(countries ?? [])].sort((a, b) => a.name.localeCompare(b.name, "ru") || a.id - b.id),
        [countries]
    )
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()
    const filteredCountries = useMemo(
        () => sortedCountries.filter((country) => {
            const cityCount = country.cities?.length ?? 0
            if (showWithoutCitiesOnly && cityCount > 0) {
                return false
            }

            if (!normalizedSearchQuery) {
                return true
            }

            const cityMatches = country.cities?.some((city) => (
                city.name.toLowerCase().includes(normalizedSearchQuery)
                || String(city.id).includes(normalizedSearchQuery)
            ))

            return (
                country.name.toLowerCase().includes(normalizedSearchQuery)
                || String(country.id).includes(normalizedSearchQuery)
                || Boolean(cityMatches)
            )
        }),
        [normalizedSearchQuery, showWithoutCitiesOnly, sortedCountries]
    )
    const selectedCountry = sortedCountries.find((country) => country.id === selectedCountryId)
    const isSaving = isCreatingCountry || isUpdatingCountry || isCreatingCity || isUpdatingCity
    const isDeletingGeography = isDeletingCountry || isDeletingCity
    const totalCities = sortedCountries.reduce((sum, country) => sum + (country.cities?.length ?? 0), 0)
    const countriesWithoutCities = sortedCountries.filter((country) => (country.cities?.length ?? 0) === 0).length
    const hasActiveFilters = Boolean(normalizedSearchQuery) || showWithoutCitiesOnly

    const resetFilters = () => {
        setSearchQuery("")
        setShowWithoutCitiesOnly(false)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingItem(null)
        setSelectedCountryId(null)
        form.resetFields()
    }

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
        try {
            const values = await form.validateFields()
            if (modalType === "country") {
                if (editingItem) {
                    await updateCountry({id: editingItem.id, ...values}).unwrap()
                    message.success("Страна обновлена")
                } else {
                    await createCountry(values).unwrap()
                    message.success("Страна создана")
                }
            } else if (editingItem) {
                await updateCity({
                    countryId: editingItem.parentId as number,
                    cityId: editingItem.id,
                    data: values
                }).unwrap()
                message.success("Город обновлён")
            } else if (selectedCountryId !== null) {
                await createCity({
                    countryId: selectedCountryId,
                    city: values
                }).unwrap()
                message.success("Город создан")
            }
            closeModal()
        } catch (error) {
            if (typeof error === "object" && error !== null && "errorFields" in error) {
                return
            }
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (type: "country" | "city", id: number, parentId?: number) => {
        try {
            if (type === "country") {
                setDeletingCountryId(id)
                await deleteCountry(id).unwrap()
                message.success("Страна удалена")
            } else if (parentId !== undefined) {
                setDeletingCityKey(`${parentId}:${id}`)
                await deleteCity({countryId: parentId, cityId: id}).unwrap()
                message.success("Город удалён")
            }
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingCountryId(null)
            setDeletingCityKey(null)
        }
    }

    const countryColumns: ColumnsType<CountryType> = [
        {
            title: "Страна",
            dataIndex: "name",
            key: "name",
            render: (name: string, country) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{name}</Typography.Text>
                    <Space wrap size={6}>
                        <Tag color="blue">ID {country.id}</Tag>
                        <Tag color={country.cities?.length ? "green" : "default"}>
                            {country.cities?.length ?? 0} городов
                        </Tag>
                    </Space>
                </Space>
            )
        },
        {
            title: "Координаты",
            dataIndex: "position",
            key: "position",
            render: (position: CountryType["position"]) => (
                <Typography.Text type={position ? undefined : "secondary"}>{formatPosition(position)}</Typography.Text>
            )
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => {
                const isDeletingThisCountry = deletingCountryId === record.id

                return (
                    <Space wrap>
                        <Button disabled={isDeletingGeography || isSaving} onClick={() => openModal("country", record)}>Редактировать</Button>
                        <Button type="primary" disabled={isDeletingGeography || isSaving} onClick={() => openModal("city", null, record.id)}>
                            Добавить город
                        </Button>
                        <Popconfirm
                            title="Удалить страну?"
                            description="Проверьте, что страна и её города не используются в точках продаж, доставке или заказах. Действие нельзя отменить из админки."
                            okText="Удалить"
                            cancelText="Отмена"
                            onConfirm={() => handleDelete("country", record.id)}
                            okButtonProps={{loading: isDeletingThisCountry}}
                        >
                            <Button danger loading={isDeletingThisCountry} disabled={isDeletingGeography && !isDeletingThisCountry}>
                                {isDeletingThisCountry ? "Удаляется…" : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    const expandedRowRender = (country: CountryType) => {
        const cityColumns: ColumnsType<CityType> = [
            {
                title: "Город",
                dataIndex: "name",
                key: "name",
                render: (name: string, city) => (
                    <Space direction="vertical" size={2}>
                        <Typography.Text strong>{name}</Typography.Text>
                        <Tag>ID {city.id}</Tag>
                    </Space>
                )
            },
            {
                title: "Координаты",
                dataIndex: "position",
                key: "position",
                render: (position: CityType["position"]) => (
                    <Typography.Text type={position ? undefined : "secondary"}>{formatPosition(position)}</Typography.Text>
                )
            },
            {
                title: "Действия",
                key: "actions",
                render: (_, record) => {
                    const cityKey = `${country.id}:${record.id}`
                    const isDeletingThisCity = deletingCityKey === cityKey

                    return (
                        <Space wrap>
                            <Button disabled={isDeletingGeography || isSaving} onClick={() => openModal("city", record, country.id)}>
                                Редактировать
                            </Button>
                            <Popconfirm
                                title="Удалить город?"
                                description="Сначала проверьте точки продаж, зоны доставки и заказы в этом городе. Действие нельзя отменить из админки."
                                okText="Удалить"
                                cancelText="Отмена"
                                onConfirm={() => handleDelete("city", record.id, country.id)}
                                okButtonProps={{loading: isDeletingThisCity}}
                            >
                                <Button danger loading={isDeletingThisCity} disabled={isDeletingGeography && !isDeletingThisCity}>
                                    {isDeletingThisCity ? "Удаляется…" : "Удалить"}
                                </Button>
                            </Popconfirm>
                        </Space>
                    )
                }
            }
        ]

        return (
            <Table
                columns={cityColumns}
                dataSource={country.cities}
                rowKey="id"
                pagination={false}
                scroll={{x: 640}}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="В этой стране ещё нет городов"
                        >
                            <Button type="primary" disabled={isSaving || isDeletingGeography} onClick={() => openModal("city", null, country.id)}>
                                Добавить первый город
                            </Button>
                        </Empty>
                    )
                }}
            />
        )
    }

    return (
        <SettingsTableSection
            title="Страны и города"
            subtitle="Справочник географии для точек продаж, доставки и адресов клиентов. Меняйте его осторожно: записи могут быть связаны с операционными данными."
            addButtonText="Добавить страну"
            onAdd={() => openModal("country")}
            addButtonDisabled={isDeletingGeography || isSaving}
        >
            <Space direction="vertical" size={12} style={{width: "100%"}}>
                {isError ? (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить страны и города"
                        description="Не меняйте географию вслепую: справочник влияет на доставку, точки продаж и адреса клиентов. Повторите загрузку или передайте проблему администратору."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                    />
                ) : null}

                <Alert
                    type={isDeletingGeography ? "warning" : "info"}
                    showIcon
                    message={isDeletingGeography ? "Удаление географии выполняется" : "Перед удалением проверьте связи"}
                    description={
                        isDeletingGeography
                            ? "Дождитесь завершения операции: на это время редактирование стран и городов заблокировано, чтобы не смешать изменения в справочнике доставки."
                            : "Если страна или город уже используется в доставке, точках продаж или заказах, сначала нужен безопасный backend-контроль связей. Сейчас админка показывает предупреждение, но не знает usage-count."
                    }
                />

                <Space direction="vertical" size={10} style={{width: "100%"}}>
                    <Space wrap size={8}>
                        <Tag color="blue">{sortedCountries.length} стран</Tag>
                        <Tag color="green">{totalCities} городов</Tag>
                        <Tag color={countriesWithoutCities ? "orange" : "default"}>
                            {countriesWithoutCities} стран без городов
                        </Tag>
                        <Tag color={hasActiveFilters ? "purple" : "default"}>
                            Найдено: {filteredCountries.length}
                        </Tag>
                    </Space>
                    <Space wrap style={{width: "100%"}}>
                        <Input.Search
                            allowClear
                            placeholder="Найти страну, город или ID"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            style={{width: 320, maxWidth: "100%"}}
                        />
                        <Checkbox
                            checked={showWithoutCitiesOnly}
                            onChange={(event) => setShowWithoutCitiesOnly(event.target.checked)}
                        >
                            Только страны без городов
                        </Checkbox>
                        {hasActiveFilters ? <Button onClick={resetFilters}>Сбросить фильтры</Button> : null}
                    </Space>
                </Space>

                <Table
                    columns={countryColumns}
                    expandable={{expandedRowRender}}
                    dataSource={filteredCountries}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{x: 760}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    hasActiveFilters
                                        ? "По текущим фильтрам страны или города не найдены"
                                        : "Страны ещё не настроены"
                                }
                            >
                                {hasActiveFilters ? (
                                    <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                ) : (
                                    <Button type="primary" disabled={isSaving || isDeletingGeography} onClick={() => openModal("country")}>Добавить страну</Button>
                                )}
                            </Empty>
                        )
                    }}
                />
            </Space>

            <Modal
                title={
                    editingItem
                        ? `Редактирование ${modalType === "country" ? "страны" : "города"}`
                        : `Создание ${modalType === "country" ? "страны" : "города"}`
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => {
                    if (!isSaving) {
                        closeModal()
                    }
                }}
                okText={isSaving ? "Сохраняем…" : editingItem ? "Сохранить" : "Создать"}
                cancelText="Отмена"
                confirmLoading={isSaving}
                cancelButtonProps={{disabled: isSaving}}
                maskClosable={!isSaving}
                keyboard={!isSaving}
                destroyOnClose
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {modalType === "city" && selectedCountry ? (
                        <Alert
                            type="info"
                            showIcon
                            message={`Город будет привязан к стране: ${selectedCountry.name}`}
                            description="Проверьте написание: это название увидят менеджеры в операционных справочниках и адресных сценариях."
                        />
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Название должно совпадать с операционным справочником доставки"
                            description="Используйте понятное русскоязычное название без внутренних кодов и сокращений."
                        />
                    )}
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            label={modalType === "country" ? "Название страны" : "Название города"}
                            extra="Например: Казахстан или Алматы. Координаты, если нужны, должны приходить из backend/API-формы отдельным безопасным изменением."
                            rules={[{required: true, message: "Введите название"}]}
                        >
                            <Input disabled={isSaving} placeholder={modalType === "country" ? "Казахстан" : "Алматы"} />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </SettingsTableSection>
    )
}

export default CountryCityPage
