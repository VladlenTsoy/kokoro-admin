import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Empty, Typography} from "antd"
import {
    useGetColorsQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation
} from "../../features/settings/color/colorApi.ts"
import type {ColorType} from "../../features/settings/color/ColorTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

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
        {
            title: "Название",
            dataIndex: "title",
            key: "title",
            render: (title: string) => <Typography.Text strong>{title}</Typography.Text>
        },
        {
            title: "Цвет",
            dataIndex: "hex",
            key: "hex",
            render: (hex: string) => (
                <Space size={8}>
                    <span
                        aria-label={`Цвет ${hex}`}
                        style={{
                            display: "inline-block",
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: "1px solid rgba(0, 0, 0, 0.16)",
                            background: hex
                        }}
                    />
                    <Typography.Text code copyable>{hex}</Typography.Text>
                </Space>
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
                    <Popconfirm
                        title="Удалить цвет?"
                        description="Проверьте, что цвет не используется в активных карточках товаров."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteColor(record.id)}
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
                title="Цвета"
                subtitle="Управляйте палитрой и статусами доступных цветов."
                addButtonText="Добавить цвет"
                onAdd={() => {
                    setEditingColor(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={colors}
                    columns={columns}
                    scroll={{x: 760}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Цвета ещё не добавлены. Создайте первый цвет, чтобы менеджеры могли быстрее заполнять варианты товаров."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                open={isModalOpen}
                title={editingColor ? "Редактировать цвет" : "Добавить цвет"}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                okText={editingColor ? "Сохранить" : "Добавить"}
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Например: Чёрный" />
                    </Form.Item>
                    <Form.Item
                        label="HEX-код"
                        extra="Используется в палитре карточки товара. Формат: #000000."
                        name="hex"
                        rules={[
                            {required: true, message: "Введите HEX"},
                            {pattern: /^#([0-9A-Fa-f]{6})$/, message: "Неверный HEX код"}
                        ]}
                    >
                        <Input type="color" aria-label="Выберите цвет" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ColorPage
