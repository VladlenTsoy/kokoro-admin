import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Empty, Typography} from "antd"
import {
    useGetSizesQuery,
    useCreateSizeMutation,
    useUpdateSizeMutation,
    useDeleteSizeMutation
} from "../../features/settings/size/sizeApi.ts"
import type {SizeType} from "../../features/settings/size/SizeTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const SizePage: React.FC = () => {
    const {data: sizes, isLoading} = useGetSizesQuery()
    const [createSize] = useCreateSizeMutation()
    const [updateSize] = useUpdateSizeMutation()
    const [deleteSize] = useDeleteSizeMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSize, setEditingSize] = useState<SizeType | null>(null)
    const [form] = Form.useForm()

    const handleSave = async () => {
        const values = await form.validateFields()
        if (editingSize) {
            await updateSize({id: editingSize.id, data: values})
        } else {
            await createSize(values)
        }
        setIsModalOpen(false)
        setEditingSize(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id", key: "id", width: 80},
        {
            title: "Название",
            dataIndex: "title",
            key: "title",
            render: (title: string) => <Typography.Text strong>{title}</Typography.Text>
        },
        {
            title: "Статус",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (date: string | null) =>
                date ? <Tag color="red">Удален</Tag> : <Tag color="green">Активен</Tag>
        },
        {
            title: "Действия",
            key: "actions",
            render: (_: unknown, record: SizeType) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingSize(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить размер?"
                        description="Проверьте, что размер не используется в активных карточках товаров."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteSize(record.id)}
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
                title="Размеры"
                subtitle="Справочник размеров для карточек товаров."
                addButtonText="Добавить размер"
                onAdd={() => {
                    setEditingSize(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={sizes}
                    columns={columns}
                    scroll={{x: 640}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Размеры ещё не добавлены. Добавьте первый размер, чтобы менеджеры могли корректно собирать варианты товаров."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                open={isModalOpen}
                title={editingSize ? "Редактировать размер" : "Добавить размер"}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                okText={editingSize ? "Сохранить" : "Добавить"}
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Например: XS, M или One size" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default SizePage
