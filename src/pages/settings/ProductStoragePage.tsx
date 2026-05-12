import React, {useMemo, useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber, Empty, Alert, Space, Tag, Typography, Segmented, Statistic, message} from "antd"
import {
    useGetStoragesQuery,
    useCreateStorageMutation,
    useUpdateStorageMutation,
    useDeleteStorageMutation
} from "../../features/settings/product-storage/productStorageApi.ts"
import type {ProductStorageType} from "../../features/settings/product-storage/productStorageTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const ProductStoragePage: React.FC = () => {
    const {data: storages = [], isLoading, isError, refetch} = useGetStoragesQuery()
    const [createStorage, {isLoading: isCreating}] = useCreateStorageMutation()
    const [updateStorage, {isLoading: isUpdating}] = useUpdateStorageMutation()
    const [deleteStorage, {isLoading: isDeleting}] = useDeleteStorageMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStorage, setEditingStorage] = useState<ProductStorageType | null>(null)
    const [deletingStorageId, setDeletingStorageId] = useState<number | null>(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")

    const [form] = Form.useForm()

    const storageSummary = useMemo(() => {
        const active = storages.filter((storage) => !storage.deleted_at).length
        return {
            total: storages.length,
            active,
            archived: storages.length - active,
            salesPoints: new Set(storages.map((storage) => storage.salesPointId)).size
        }
    }, [storages])

    const filteredStorages = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return storages.filter((storage) => {
            const matchesSearch = !normalizedSearch
                || storage.title.toLowerCase().includes(normalizedSearch)
                || String(storage.id).includes(normalizedSearch)
                || String(storage.salesPointId).includes(normalizedSearch)
            const matchesStatus = statusFilter === "all"
                || (statusFilter === "active" && !storage.deleted_at)
                || (statusFilter === "archived" && Boolean(storage.deleted_at))

            return matchesSearch && matchesStatus
        })
    }, [search, statusFilter, storages])

    const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "all"
    const isMutationInFlight = isCreating || isUpdating || isDeleting

    const resetFilters = () => {
        setSearch("")
        setStatusFilter("all")
    }

    const openCreate = () => {
        setEditingStorage(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const openEdit = (record: ProductStorageType) => {
        setEditingStorage(record)
        form.setFieldsValue(record)
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        const values = await form.validateFields()

        try {
            if (editingStorage) {
                await updateStorage({id: editingStorage.id, body: values}).unwrap()
                message.success("Склад обновлён")
            } else {
                await createStorage(values).unwrap()
                message.success("Склад создан")
            }
            setIsModalOpen(false)
            setEditingStorage(null)
            form.resetFields()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingStorageId(id)
        try {
            await deleteStorage(id).unwrap()
            message.success("Склад удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingStorageId(null)
        }
    }

    const columns = [
        {
            title: "Склад",
            dataIndex: "title",
            render: (title: string, record: ProductStorageType) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">ID склада: {record.id}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Точка продаж",
            dataIndex: "salesPointId",
            render: (salesPointId: number) => (
                <Tag color="blue">Точка #{salesPointId}</Tag>
            )
        },
        {
            title: "Статус",
            dataIndex: "deleted_at",
            render: (deletedAt?: string | null) => deletedAt ? (
                <Tag color="default">Архив</Tag>
            ) : (
                <Tag color="green">Активен</Tag>
            )
        },
        {
            title: "Действия",
            render: (_: unknown, record: ProductStorageType) => {
                const isCurrentStorageDeleting = deletingStorageId === record.id

                return (
                    <Space wrap>
                        <Button type="link" onClick={() => openEdit(record)} disabled={isMutationInFlight}>
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить склад?"
                            description="Перед удалением убедитесь, что к складу не привязаны активные остатки или заказы."
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{loading: isCurrentStorageDeleting}}
                            onConfirm={() => handleDelete(record.id)}
                            disabled={isMutationInFlight && !isCurrentStorageDeleting}
                        >
                            <Button type="link" danger loading={isCurrentStorageDeleting} disabled={isMutationInFlight && !isCurrentStorageDeleting}>
                                {isCurrentStorageDeleting ? "Удаляем..." : "Удалить"}
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
                title="Склады"
                subtitle="Склады и привязка к точкам продаж. Проверяйте точку продаж перед изменением — это влияет на остатки и выдачу заказов."
                addButtonText="Добавить склад"
                onAdd={openCreate}
                addButtonDisabled={isMutationInFlight}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить склады"
                            description="Проверьте соединение и повторите загрузку перед изменением складских настроек."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    )}
                    {!isError && isDeleting && deletingStorageId !== null && (
                        <Alert
                            type="warning"
                            showIcon
                            message={`Удаляем склад #${deletingStorageId}`}
                            description="Дождитесь завершения операции перед созданием, редактированием или удалением других складов, чтобы не запутать остатки и точки выдачи."
                        />
                    )}
                    {!isError && storages.length > 0 && (
                        <>
                            <Alert
                                type="info"
                                showIcon
                                message={`Активных складов: ${storageSummary.active}`}
                                description={`Архивных: ${storageSummary.archived}. Перед правкой склада проверьте точку продаж — от неё зависят остатки, выдача и менеджерский подбор товара.`}
                            />
                            <Space wrap size={12}>
                                <Statistic title="Всего складов" value={storageSummary.total} loading={isLoading} />
                                <Statistic title="Активных" value={storageSummary.active} loading={isLoading} />
                                <Statistic title="Архивных" value={storageSummary.archived} loading={isLoading} />
                                <Statistic title="Точек продаж" value={storageSummary.salesPoints} loading={isLoading} />
                                <Statistic title="Найдено" value={filteredStorages.length} loading={isLoading} />
                            </Space>
                            <Space wrap style={{width: "100%"}}>
                                <Input.Search
                                    allowClear
                                    placeholder="Найти по названию, ID склада или ID точки продаж"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    style={{minWidth: 280, maxWidth: 420}}
                                />
                                <Segmented
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value as "all" | "active" | "archived")}
                                    options={[
                                        {label: "Все", value: "all"},
                                        {label: "Активные", value: "active"},
                                        {label: "Архив", value: "archived"}
                                    ]}
                                />
                                {hasActiveFilters && (
                                    <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                )}
                            </Space>
                        </>
                    )}
                    <Table
                        loading={isLoading}
                        dataSource={filteredStorages}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        locale={{
                            emptyText: hasActiveFilters ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="По этим фильтрам склады не найдены"
                                >
                                    <Button onClick={resetFilters}>Сбросить фильтры</Button>
                                </Empty>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Склады ещё не добавлены"
                                >
                                    <Button
                                        type="primary"
                                        onClick={openCreate}
                                    >
                                        Добавить первый склад
                                    </Button>
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingStorage ? "Редактирование склада" : "Создание склада"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingStorage ? "Сохранить" : "Создать склад"}
                cancelText="Отмена"
                confirmLoading={isCreating || isUpdating}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Склад должен быть привязан к корректной точке продаж"
                    description="Неверная привязка может запутать менеджеров при проверке остатков и выдаче заказа."
                />
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название склада" rules={[{required: true, message: "Введите название склада"}]}>
                        <Input placeholder="Например: Основной склад шоурума" />
                    </Form.Item>
                    <Form.Item
                        name="salesPointId"
                        label="ID точки продаж"
                        tooltip="Используйте ID существующей точки продаж, к которой относится склад."
                        rules={[{required: true, message: "Укажите ID точки продаж"}]}
                    >
                        <InputNumber min={1} precision={0} style={{width: "100%"}} placeholder="Например: 1" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductStoragePage
