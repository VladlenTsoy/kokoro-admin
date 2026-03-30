import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber} from "antd"
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
        {title: "ID", dataIndex: "id"},
        {title: "Название", dataIndex: "title"},
        {title: "ID точки продаж", dataIndex: "salesPointId"},
        {
            title: "Действия",
            render: (_: any, record: ProductStorageType) => (
                <>
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
                    <Popconfirm title="Удалить склад?" onConfirm={() => deleteStorage(record.id)}>
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Склады"
                subtitle="Склады и привязка к точкам продаж."
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
                />
            </SettingsTableSection>

            <Modal
                title={editingStorage ? "Редактирование склада" : "Создание склада"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="salesPointId" label="ID точки продаж" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductStoragePage
