import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Table, Typography, message} from "antd"
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
    const [deleteCollection, {isLoading: isDeleting}] = useDeleteCollectionMutation()

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

    const closeModal = () => {
        setIsOpen(false)
        setEditing(null)
        form.resetFields()
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            const title = values.title.trim()

            if (editing) {
                await updateCollection({id: editing.id, title}).unwrap()
                message.success("Коллекция обновлена")
            } else {
                await createCollection({title}).unwrap()
                message.success("Коллекция создана")
            }
            closeModal()
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
        {
            title: "Коллекция",
            dataIndex: "title",
            render: (title: string) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">Группа для витрины и вариантов товаров</Typography.Text>
                </Space>
            )
        },
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, record) => (
                <Space wrap>
                    <Button type="link" onClick={() => openEdit(record)}>
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить коллекцию?"
                        description="Проверьте, что коллекция не используется в активных товарах и фильтрах витрины."
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{danger: true, loading: isDeleting}}
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
        <>
            <SettingsTableSection
                title="Коллекции"
                subtitle="Управление коллекциями для витрины, фильтров и вариантов товаров."
                addButtonText="Добавить коллекцию"
                onAdd={openCreate}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Коллекции влияют на навигацию покупателей"
                        description="Используйте понятные сезонные или тематические названия, чтобы менеджеры быстрее находили нужные группы товаров."
                    />
                    <Table
                        rowKey="id"
                        loading={isLoading}
                        dataSource={data || []}
                        columns={columns}
                        pagination={false}
                        scroll={{x: 640}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Коллекции ещё не созданы"
                                >
                                    <Button type="primary" onClick={openCreate}>Создать первую коллекцию</Button>
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                open={isOpen}
                title={editing ? "Редактировать коллекцию" : "Создать коллекцию"}
                onCancel={closeModal}
                onOk={handleSave}
                confirmLoading={isCreating || isUpdating}
                okText={editing ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Название"
                        extra="Например: Summer 2026, Naruto Drop или Gifts under 500k."
                        rules={[
                            {required: true, message: "Введите название коллекции"},
                            {whitespace: true, message: "Название не может быть пустым"},
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
