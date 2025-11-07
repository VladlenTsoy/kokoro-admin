import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, Switch} from "antd"
import {
    useGetSourcesQuery,
    useCreateSourceMutation,
    useUpdateSourceMutation,
    useDeleteSourceMutation
} from "../../features/source/sourceApi.ts"
import type {SourceType} from "../../features/source/SourceType.ts"

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
        {title: "Title", dataIndex: "title"},
        {title: "Code", dataIndex: "code"},
        {
            title: "Active",
            dataIndex: "isActive",
            render: (val: boolean) => (val ? "Yes" : "No")
        },
        {
            title: "Actions",
            render: (_: any, record: ISource) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingSource(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm title="Delete source?" onConfirm={() => deleteSource(record.id)}>
                        <Button type="link" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <Button
                type="primary"
                style={{marginBottom: 16}}
                onClick={() => {
                    setEditingSource(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Add Source
            </Button>

            <Table
                loading={isLoading}
                dataSource={data || []}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingSource ? "Edit Source" : "Add Source"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label="Code" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="isActive" label="Active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SourcePage
