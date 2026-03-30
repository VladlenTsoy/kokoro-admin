import {Button, Form, Input, Modal, Popconfirm, Space, Table, message} from "antd"
import {useState} from "react"
import type {ColumnsType} from "antd/es/table"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import type {CollectionType} from "../../features/settings/collection/CollectionTypes.ts"
import {
    useCreateCollectionMutation,
    useDeleteCollectionMutation,
    useGetCollectionsQuery,
    useUpdateCollectionMutation
} from "../../features/settings/collection/collectionApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

interface FormValues {
    title: string
}

const CollectionsPage = () => {
    const [form] = Form.useForm<FormValues>()
    const {data, isLoading} = useGetCollectionsQuery()
    const [createCollection, {isLoading: isCreating}] = useCreateCollectionMutation()
    const [updateCollection, {isLoading: isUpdating}] = useUpdateCollectionMutation()
    const [deleteCollection] = useDeleteCollectionMutation()

    const [isOpen, setIsOpen] = useState(false)
    const [editing, setEditing] = useState<CollectionType | null>(null)

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setIsOpen(true)
    }

    const openEdit = (record: CollectionType) => {
        setEditing(record)
        form.setFieldsValue({title: record.title})
        setIsOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            if (editing) {
                await updateCollection({id: editing.id, title: values.title}).unwrap()
                message.success("Коллекция обновлена")
            } else {
                await createCollection({title: values.title}).unwrap()
                message.success("Коллекция создана")
            }
            setIsOpen(false)
            setEditing(null)
            form.resetFields()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteCollection(id).unwrap()
            message.success("Коллекция удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<CollectionType> = [
        {title: "ID", dataIndex: "id", width: 80},
        {title: "Название", dataIndex: "title"},
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(record)}>
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить коллекцию?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Коллекции"
                subtitle="Управление коллекциями для вариантов товаров."
                addButtonText="Добавить коллекцию"
                onAdd={openCreate}
            >
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    pagination={false}
                />
            </SettingsTableSection>

            <Modal
                open={isOpen}
                title={editing ? "Редактировать коллекцию" : "Создать коллекцию"}
                onCancel={() => setIsOpen(false)}
                onOk={handleSave}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Название"
                        rules={[
                            {required: true, message: "Введите название коллекции"},
                            {max: 150, message: "Максимум 150 символов"}
                        ]}
                    >
                        <Input placeholder="Summer 2026" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default CollectionsPage
