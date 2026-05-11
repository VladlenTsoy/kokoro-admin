import React, {useMemo, useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber, Empty, Alert, Space, Tag, Typography, message} from "antd"
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
    const [deleteStorage] = useDeleteStorageMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStorage, setEditingStorage] = useState<ProductStorageType | null>(null)

    const [form] = Form.useForm()

    const storageSummary = useMemo(() => {
        const active = storages.filter((storage) => !storage.deleted_at).length
        return {
            active,
            archived: storages.length - active
        }
    }, [storages])

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
        try {
            await deleteStorage(id).unwrap()
            message.success("Склад удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
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
            render: (_: unknown, record: ProductStorageType) => (
                <Space wrap>
                    <Button type="link" onClick={() => openEdit(record)}>
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить склад?"
                        description="Перед удалением убедитесь, что к складу не привязаны активные остатки или заказы."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Склады"
                subtitle="Склады и привязка к точкам продаж. Проверяйте точку продаж перед изменением — это влияет на остатки и выдачу заказов."
                addButtonText="Добавить склад"
                onAdd={openCreate}
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
                    {!isError && storages.length > 0 && (
                        <Alert
                            type="info"
                            showIcon
                            message={`Активных складов: ${storageSummary.active}`}
                            description={`Архивных: ${storageSummary.archived}. Перед правкой склада проверьте точку продаж — от неё зависят остатки, выдача и менеджерский подбор товара.`}
                        />
                    )}
                    <Table
                        loading={isLoading}
                        dataSource={storages}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        locale={{
                            emptyText: (
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
