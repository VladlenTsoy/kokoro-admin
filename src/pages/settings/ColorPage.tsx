import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag} from "antd"
import {
    useGetColorsQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation
} from "../../features/settings/color/colorApi.ts"
import type {ColorType} from "../../features/settings/color/ColorTypes.ts"

const ColorPage: React.FC = () => {
    const {data: colors, isLoading} = useGetColorsQuery()
    const [createColor] = useCreateColorMutation()
    const [updateColor] = useUpdateColorMutation()
    const [deleteColor] = useDeleteColorMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingColor, setEditingColor] = useState<ColorType | null>(null)
    const [form] = Form.useForm()

    const handleSave = async () => {
        const values = await form.validateFields()
        if (editingColor) {
            await updateColor({id: editingColor.id, data: values})
        } else {
            await createColor(values)
        }
        setIsModalOpen(false)
        setEditingColor(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id", key: "id", width: 80},
        {title: "Название", dataIndex: "title", key: "title"},
        {
            title: "Цвет",
            dataIndex: "hex",
            key: "hex",
            render: (hex: string) => (
                <Tag color={hex} style={{color: "#000"}}>
                    {hex}
                </Tag>
            )
        },
        {
            title: "Удален?",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (date: string | null) =>
                date ? <Tag color="red">Удален</Tag> : <Tag color="green">Активен</Tag>
        },
        {
            title: "Действия",
            key: "actions",
            render: (_: undefined, record: ColorType) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingColor(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить?" onConfirm={() => deleteColor(record.id)}>
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
                    setEditingColor(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Добавить цвет
            </Button>

            <Table
                rowKey="id"
                loading={isLoading}
                dataSource={colors}
                columns={columns}
            />

            <Modal
                open={isModalOpen}
                title={editingColor ? "Редактировать цвет" : "Добавить цвет"}
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
                    <Form.Item
                        label="HEX"
                        name="hex"
                        rules={[
                            {required: true, message: "Введите HEX"},
                            {pattern: /^#([0-9A-Fa-f]{6})$/, message: "Неверный HEX код"}
                        ]}
                    >
                        <Input type="color" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ColorPage
