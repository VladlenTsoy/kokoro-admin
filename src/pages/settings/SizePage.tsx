import React, {useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Alert, Empty, Typography, message} from "antd"
import {createStyles} from "antd-style"
import {
    useGetSizesQuery,
    useCreateSizeMutation,
    useUpdateSizeMutation,
    useDeleteSizeMutation
} from "../../features/settings/size/sizeApi.ts"
import type {SizeType} from "../../features/settings/size/SizeTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const {Text} = Typography

const useStyles = createStyles(({token}) => ({
    formHint: {
        display: "block",
        marginTop: token.marginXXS
    }
}))

const SizePage: React.FC = () => {
    const {styles} = useStyles()
    const {data: sizes = [], isLoading, isError, refetch} = useGetSizesQuery()
    const [createSize, {isLoading: isCreating}] = useCreateSizeMutation()
    const [updateSize, {isLoading: isUpdating}] = useUpdateSizeMutation()
    const [deleteSize, {isLoading: isDeleting}] = useDeleteSizeMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSize, setEditingSize] = useState<SizeType | null>(null)
    const [form] = Form.useForm()

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            if (editingSize) {
                await updateSize({id: editingSize.id, data: values}).unwrap()
                message.success("Размер обновлён")
            } else {
                await createSize(values).unwrap()
                message.success("Размер создан")
            }
            setIsModalOpen(false)
            setEditingSize(null)
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
            await deleteSize(id).unwrap()
            message.success("Размер удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
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
                        description="Проверьте, что размер не используется в активных товарах. Удаление может убрать вариант из выбора менеджеров и карточек заказа."
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
                title="Размеры"
                subtitle="Управляйте размерной сеткой каталога: названия должны быть короткими, единообразными и понятными менеджерам при подборе товара."
                addButtonText="Добавить размер"
                onAdd={() => {
                    setEditingSize(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить размеры"
                        description="Проверьте подключение или повторите загрузку, чтобы менеджеры не работали со старым справочником."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                    />
                )}
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={sizes}
                    columns={columns}
                    scroll={{x: 640}}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Размеры пока не добавлены"
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setEditingSize(null)
                                        form.resetFields()
                                        setIsModalOpen(true)
                                    }}
                                >
                                    Добавить первый размер
                                </Button>
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                open={isModalOpen}
                title={editingSize ? "Редактировать размер" : "Добавить размер"}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                confirmLoading={isCreating || isUpdating}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        extra="Используйте формат, который менеджер сразу узнает в карточке товара и заказе: XS, S, M, 42, One Size."
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Например: M" />
                    </Form.Item>
                    <Text type="secondary" className={styles.formHint}>
                        Перед сохранением проверьте единый стиль написания: дубли вроде «M» и «m» усложняют подбор размера и учет остатков.
                    </Text>
                </Form>
            </Modal>
        </>
    )
}

export default SizePage
