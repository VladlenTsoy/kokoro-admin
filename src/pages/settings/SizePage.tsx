import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag} from "antd"
import {
    useGetSizesQuery,
    useCreateSizeMutation,
    useUpdateSizeMutation,
    useDeleteSizeMutation
} from "../../features/settings/size/sizeApi.ts"
import type {SizeType} from "../../features/settings/size/SizeTypes.ts"

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
        {title: "Название", dataIndex: "title", key: "title"},
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
            render: (_: any, record: SizeType) => (
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
                    <Popconfirm title="Удалить?" onConfirm={() => deleteSize(record.id)}>
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
            <Button
                type="primary"
                style={{marginBottom: 16}}
                onClick={() => {
                    setEditingSize(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Добавить размер
            </Button>

            <Table
                rowKey="id"
                loading={isLoading}
                dataSource={sizes}
                columns={columns}
            />

            <Modal
                open={isModalOpen}
                title={editingSize ? "Редактировать размер" : "Добавить размер"}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default SizePage
