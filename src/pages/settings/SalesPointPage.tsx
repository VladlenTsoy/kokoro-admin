import React, {useMemo, useState} from "react"
import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation
} from "../../features/settings/sales-point/salesPointApi.ts"
import type {SalesPointType} from "../../features/settings/sales-point/SalesPointTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"

const SalesPointPage: React.FC = () => {
    const {data: salesPoints = [], isLoading, isFetching, isError, refetch} = useGetSalesPointsQuery()
    const [createSalesPoint, {isLoading: isCreatingSalesPoint}] = useCreateSalesPointMutation()
    const [updateSalesPoint, {isLoading: isUpdatingSalesPoint}] = useUpdateSalesPointMutation()
    const [deleteSalesPoint, {isLoading: isDeletingSalesPoint}] = useDeleteSalesPointMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPoint, setEditingPoint] = useState<SalesPointType | null>(null)
    const [deletingSalesPointId, setDeletingSalesPointId] = useState<number | null>(null)
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")

    const [form] = Form.useForm()

    const activeSalesPointsCount = useMemo(
        () => salesPoints.filter((point) => !point.deleted_at).length,
        [salesPoints]
    )
    const archivedSalesPointsCount = salesPoints.length - activeSalesPointsCount
    const normalizedSearchValue = searchValue.trim().toLowerCase()
    const hasActiveFilters = Boolean(normalizedSearchValue) || statusFilter !== "all"
    const filteredSalesPoints = useMemo(
        () => salesPoints.filter((point) => {
            const matchesSearch = !normalizedSearchValue
                || point.title.toLowerCase().includes(normalizedSearchValue)
                || String(point.id).includes(normalizedSearchValue)
                || String(point.location.lat).includes(normalizedSearchValue)
                || String(point.location.lng).includes(normalizedSearchValue)
            const isArchived = Boolean(point.deleted_at)
            const matchesStatus = statusFilter === "all"
                || (statusFilter === "active" && !isArchived)
                || (statusFilter === "archived" && isArchived)

            return matchesSearch && matchesStatus
        }),
        [normalizedSearchValue, salesPoints, statusFilter]
    )
    const resetFilters = () => {
        setSearchValue("")
        setStatusFilter("all")
    }
    const isSaving = isCreatingSalesPoint || isUpdatingSalesPoint
    const isSalesPointListUnsafe = isLoading || isFetching || isError
    const isMutationInFlight = isSaving || isDeletingSalesPoint
    const areSalesPointActionsBlocked = isSalesPointListUnsafe || isMutationInFlight
    const salesPointActionsDisabledReason = isLoading
        ? "Загружаем точки продаж. Дождитесь подтверждённого списка перед изменениями филиалов."
        : isFetching
            ? "Обновляем список точек продаж. Дождитесь свежих данных перед изменениями филиалов."
            : isError
                ? "Список точек продаж не подтверждён. Нажмите «Повторить» и меняйте филиалы только после успешной загрузки."
                : isSaving
                    ? "Сохраняем точку продаж. Новые изменения временно заблокированы, чтобы не смешать координаты и название."
                    : isDeletingSalesPoint
                        ? "Удаляем точку продаж. Дождитесь завершения операции перед новыми изменениями."
                        : undefined

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingPoint(null)
        form.resetFields()
    }

    const handleModalCancel = () => {
        if (isSaving) {
            return
        }
        closeModal()
    }

    const openCreateModal = () => {
        if (areSalesPointActionsBlocked) {
            return
        }
        setEditingPoint(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const body = {
                title: values.title,
                location: {
                    lat: values.lat,
                    lng: values.lng
                }
            }
            if (editingPoint) {
                await updateSalesPoint({id: editingPoint.id, body}).unwrap()
                message.success("Точка продаж обновлена")
            } else {
                await createSalesPoint(body).unwrap()
                message.success("Точка продаж создана")
            }
            closeModal()
        } catch (error) {
            if (isAntdFormValidationError(error)) {
                return
            }
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingSalesPointId(id)
        try {
            await deleteSalesPoint(id).unwrap()
            message.success("Точка продаж удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingSalesPointId(null)
        }
    }

    const columns: ColumnsType<SalesPointType> = [
        {
            title: "Точка продаж",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">ID точки: {record.id}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Координаты",
            dataIndex: "location",
            render: (location: SalesPointType["location"]) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text>{location.lat}, {location.lng}</Typography.Text>
                    <Typography.Text type="secondary">Широта / долгота для карты и выдачи</Typography.Text>
                </Space>
            )
        },
        {
            title: "Статус",
            dataIndex: "deleted_at",
            width: 140,
            render: (deletedAt?: string | null) => deletedAt ? (
                <Tag color="default">Архив</Tag>
            ) : (
                <Tag color="green">Активна</Tag>
            )
        },
        {
            title: "Действия",
            width: 220,
            render: (_: unknown, record: SalesPointType) => {
                const isCurrentSalesPointDeleting = deletingSalesPointId === record.id

                return (
                    <Space wrap>
                        <Button
                            type="link"
                            disabled={areSalesPointActionsBlocked}
                            onClick={() => {
                                setEditingPoint(record)
                                form.setFieldsValue({
                                    title: record.title,
                                    lat: record.location.lat,
                                    lng: record.location.lng
                                })
                                setIsModalOpen(true)
                            }}
                        >
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить точку продаж?"
                            description="Перед удалением проверьте склады, зоны доставки и заказы, которые могут быть привязаны к этой точке. Если есть история операций, безопаснее сначала отключить её на уровне бизнес-процесса."
                            okText="Удалить"
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{loading: isCurrentSalesPointDeleting}}
                        >
                            <Button type="link" danger loading={isCurrentSalesPointDeleting} disabled={areSalesPointActionsBlocked && !isCurrentSalesPointDeleting}>
                                {isCurrentSalesPointDeleting ? "Удаляем..." : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Точки продаж"
                subtitle="Филиалы, шоурумы и пункты выдачи. Проверяйте координаты перед сохранением — они влияют на карту, самовывоз и складскую привязку."
                addButtonText="Добавить точку продаж"
                onAdd={openCreateModal}
                addButtonDisabled={areSalesPointActionsBlocked}
                addButtonDisabledReason={salesPointActionsDisabledReason}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message={`Активных точек продаж: ${activeSalesPointsCount} из ${salesPoints.length}`}
                        description="Название должно быть понятным менеджеру в заказе, а координаты — достаточно точными для клиента и курьера. Не удаляйте точки с активными складами или заказами без проверки связей."
                    />
                    {isDeletingSalesPoint && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Удаление точки продаж ещё выполняется"
                            description="Дождитесь завершения операции: создание, редактирование и соседние удаления временно заблокированы, чтобы не смешать изменения филиалов, складов и самовывоза."
                        />
                    )}
                    <Space wrap style={{width: "100%"}}>
                        <Input.Search
                            allowClear
                            placeholder="Поиск по названию, ID или координатам"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            style={{minWidth: 260, flex: 1}}
                        />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{minWidth: 180}}
                            options={[
                                {value: "all", label: `Все статусы (${salesPoints.length})`},
                                {value: "active", label: `Активные (${activeSalesPointsCount})`},
                                {value: "archived", label: `Архив (${archivedSalesPointsCount})`}
                            ]}
                        />
                        <Typography.Text type="secondary">
                            Найдено: {filteredSalesPoints.length}
                        </Typography.Text>
                        {hasActiveFilters && (
                            <Button onClick={resetFilters}>Сбросить фильтры</Button>
                        )}
                    </Space>
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить точки продаж"
                            description="Повторите загрузку перед изменением филиалов, чтобы не принять решение по устаревшему списку."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    )}
                    <Table<SalesPointType>
                        loading={isLoading || isFetching}
                        dataSource={filteredSalesPoints}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        locale={{
                            emptyText: hasActiveFilters ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="По текущим фильтрам точки продаж не найдены"
                                >
                                    <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                </Empty>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Точки продаж ещё не настроены"
                                >
                                    <Button type="primary" onClick={openCreateModal} disabled={areSalesPointActionsBlocked}>
                                        Добавить первую точку
                                    </Button>
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingPoint ? "Редактирование точки продаж" : "Создание точки продаж"}
                open={isModalOpen}
                onCancel={handleModalCancel}
                onOk={handleSubmit}
                okText={isSaving ? "Сохраняем..." : editingPoint ? "Сохранить" : "Создать точку"}
                cancelText="Отмена"
                confirmLoading={isSaving}
                cancelButtonProps={{disabled: isSaving}}
                closable={!isSaving}
                maskClosable={!isSaving}
                keyboard={!isSaving}
                destroyOnClose
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Координаты используются в клиентских и менеджерских сценариях"
                    description="После изменения проверьте отображение точки на карте и связь со складами/доставкой, чтобы менеджеры не отправляли клиентов по неверному адресу."
                />
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название точки" rules={[{required: true, message: "Введите название точки продаж"}]}>
                        <Input disabled={isSaving} placeholder="Например: Шоурум ЦУМ" />
                    </Form.Item>
                    <Form.Item
                        name="lat"
                        label="Широта"
                        extra="Диапазон от -90 до 90. Скопируйте координату из проверенной карты."
                        rules={[{required: true, message: "Укажите широту"}]}
                    >
                        <InputNumber disabled={isSaving} style={{width: "100%"}} min={-90} max={90} step={0.000001} placeholder="41.311081" />
                    </Form.Item>
                    <Form.Item
                        name="lng"
                        label="Долгота"
                        extra="Диапазон от -180 до 180. Ошибка в знаке или цифре может увести точку в другой город."
                        rules={[{required: true, message: "Укажите долготу"}]}
                    >
                        <InputNumber disabled={isSaving} style={{width: "100%"}} min={-180} max={180} step={0.000001} placeholder="69.240562" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SalesPointPage
