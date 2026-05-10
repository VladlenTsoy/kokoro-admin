import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber, Empty, Space, Tag, Typography} from "antd"
import {
    useGetStoragesQuery,
    useCreateStorageMutation,
    useUpdateStorageMutation,
    useDeleteStorageMutation
} from "../../features/settings/product-storage/productStorageApi.ts"
import type {ProductStorageType} from "../../features/settings/product-storage/productStorageTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const ProductStoragePage: React.FC = () => {
    const {data, isLoading} = useGetStoragesQuery()
    const [createStorage] = useCreateStorageMutation()
    const [updateStorage] = useUpdateStorageMutation()
    const [deleteStorage] = useDeleteStorageMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStorage, setEditingStorage] = useState<ProductStorageType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingStorage) {
            await updateStorage({id: editingStorage.id, body: values})
        } else {
            await createStorage(values)
        }
        setIsModalOpen(false)
        setEditingStorage(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id", width: 80},
        {
            title: "Название",
            dataIndex: "title",
            render: (title: string) => <Typography.Text strong>{title}</Typography.Text>
        },
        {
            title: "Точка продаж",
            dataIndex: "salesPointId",
            render: (salesPointId: number) => <Typography.Text code>ID {salesPointId}</Typography.Text>
        },
        {
            title: "Статус",
            dataIndex: "deleted_at",
            render: (date: string | null) => date ? <Tag color="red">Удалён</Tag> : <Tag color="green">Активен</Tag>
        },
        {
            title: "Действия",
            render: (_: unknown, record: ProductStorageType) => (
                <Space wrap>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingStorage(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить склад?"
                        description="Проверьте остатки и привязку к точке продаж перед удалением."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteStorage(record.id)}
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
                subtitle="Склады и привязка к точкам продаж: проверьте ID точки перед изменениями, чтобы не сбить остатки и выдачу заказов."
                addButtonText="Добавить склад"
                onAdd={() => {
                    setEditingStorage(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Table
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 760}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Склады ещё не добавлены. Создайте склад и привяжите его к точке продаж, чтобы менеджеры могли корректно управлять остатками."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingStorage ? "Редактирование склада" : "Создание склада"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingStorage ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Название"
                        rules={[{required: true, message: "Введите название склада"}]}
                    >
                        <Input placeholder="Например: Основной склад Ташкент" />
                    </Form.Item>
                    <Form.Item
                        name="salesPointId"
                        label="ID точки продаж"
                        extra="Используется для связи склада с точкой продаж. Проверьте ID перед сохранением."
                        rules={[{required: true, message: "Введите ID точки продаж"}]}
                    >
                        <InputNumber min={1} precision={0} style={{width: "100%"}} placeholder="Например: 1" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductStoragePage
