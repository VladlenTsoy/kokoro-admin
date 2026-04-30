import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch} from "antd"
import {
    useGetSourcesQuery,
    useCreateSourceMutation,
    useUpdateSourceMutation,
    useDeleteSourceMutation
} from "../../features/source/sourceApi.ts"
import type {SourceType} from "../../features/source/SourceType.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const SourcePage: React.FC = () => {
    const {data, isLoading} = useGetSourcesQuery()
    const [createSource] = useCreateSourceMutation()
    const [updateSource] = useUpdateSourceMutation()
    const [deleteSource] = useDeleteSourceMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSource, setEditingSource] = useState<SourceType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingSource) {
            await updateSource({id: editingSource.id, body: values})
        } else {
            await createSource(values)
        }
        setIsModalOpen(false)
        setEditingSource(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id"},
        {title: "Название", dataIndex: "title"},
        {title: "Код", dataIndex: "code"},
        {
            title: "Активен",
            dataIndex: "isActive",
            render: (val: boolean) => (val ? "Да" : "Нет")
        },
        {
            title: "Действия",
            render: (_: unknown, record: SourceType) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingSource(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить источник?" onConfirm={() => deleteSource(record.id)}>
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
                title="Источники заказов"
                subtitle="Управление каналами поступления заказов."
                addButtonText="Добавить источник"
                onAdd={() => {
                    setEditingSource(null)
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
                title={editingSource ? "Редактирование источника" : "Создание источника"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label="Код" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SourcePage
