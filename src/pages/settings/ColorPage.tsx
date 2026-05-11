import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Alert, Empty, Typography, message} from "antd"
import {createStyles} from "antd-style"
import {
    useGetColorsQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation
} from "../../features/settings/color/colorApi.ts"
import type {ColorType} from "../../features/settings/color/ColorTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const {Text} = Typography

const useStyles = createStyles(({token}) => ({
    colorPreview: {
        display: "inline-flex",
        alignItems: "center",
        gap: token.marginXS
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: token.borderRadiusSM,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: token.boxShadowTertiary
    },
    formHint: {
        display: "block",
        marginTop: token.marginXXS
    }
}))

const ColorPage: React.FC = () => {
    const {styles} = useStyles()
    const {data: colors = [], isLoading, isError, refetch} = useGetColorsQuery()
    const [createColor, {isLoading: isCreating}] = useCreateColorMutation()
    const [updateColor, {isLoading: isUpdating}] = useUpdateColorMutation()
    const [deleteColor, {isLoading: isDeleting}] = useDeleteColorMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingColor, setEditingColor] = useState<ColorType | null>(null)
    const [form] = Form.useForm()

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            if (editingColor) {
                await updateColor({id: editingColor.id, data: values}).unwrap()
                message.success("Цвет обновлён")
            } else {
                await createColor(values).unwrap()
                message.success("Цвет создан")
            }
            setIsModalOpen(false)
            setEditingColor(null)
            form.resetFields()
        } catch (error) {
            if (typeof error === "object" && error !== null && "errorFields" in error) {
                return
            }
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteColor(id).unwrap()
            message.success("Цвет удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns = [
        {title: "ID", dataIndex: "id", key: "id", width: 80},
        {title: "Название", dataIndex: "title", key: "title"},
        {
            title: "Цвет",
            dataIndex: "hex",
            key: "hex",
            render: (hex: string) => (
                <span className={styles.colorPreview}>
                    <span
                        aria-hidden="true"
                        className={styles.colorSwatch}
                        style={{backgroundColor: hex}}
                    />
                    <Text code>{hex}</Text>
                </span>
            )
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
                        description="Проверьте, что цвет не используется в активных товарах. Это действие может убрать вариант из выбора менеджеров."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => handleDelete(record.id)}
                        okButtonProps={{loading: isDeleting}}
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
                subtitle="Управляйте палитрой каталога: название должно быть понятным менеджеру, HEX — совпадать с фактическим цветом товара."
                addButtonText="Добавить цвет"
                onAdd={() => {
                    setEditingColor(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить цвета"
                        description="Проверьте подключение или повторите загрузку, чтобы менеджеры не работали со старым справочником."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                    />
                )}
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={colors}
                    columns={columns}
                    scroll={{x: 720}}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Цвета пока не добавлены"
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setEditingColor(null)
                                        form.resetFields()
                                        setIsModalOpen(true)
                                    }}
                                >
                                    Добавить первый цвет
                                </Button>
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                open={isModalOpen}
                title={editingColor ? "Редактировать цвет" : "Добавить цвет"}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        extra="Используйте короткое понятное название для менеджеров и карточек товара, например: «Молочный», «Графит»."
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Например: Молочный" />
                    </Form.Item>
                    <Form.Item
                        label="HEX"
                        name="hex"
                        extra="Выберите точный цвет или вставьте HEX в формате #RRGGBB."
                        rules={[
                            {required: true, message: "Введите HEX"},
                            {pattern: /^#([0-9A-Fa-f]{6})$/, message: "Неверный HEX код"}
                        ]}
                    >
                        <Input type="color" />
                    </Form.Item>
                    <Text type="secondary" className={styles.formHint}>
                        Перед сохранением проверьте, что цвет совпадает с фото товара: это снижает ошибки при комплектации заказа.
                    </Text>
                </Form>
            </Modal>
        </>
    )
}

export default ColorPage
