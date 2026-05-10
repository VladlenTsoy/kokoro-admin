import React, {useState} from "react"
import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation
} from "../../features/settings/sales-point/salesPointApi.ts"
import type {SalesPointType} from "../../features/settings/sales-point/SalesPointTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

interface SalesPointFormValues {
    title: string
    lat: number
    lng: number
}

const SalesPointPage: React.FC = () => {
    const {data, isLoading} = useGetSalesPointsQuery()
    const [createSalesPoint, {isLoading: isCreating}] = useCreateSalesPointMutation()
    const [updateSalesPoint, {isLoading: isUpdating}] = useUpdateSalesPointMutation()
    const [deleteSalesPoint, {isLoading: isDeleting}] = useDeleteSalesPointMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPoint, setEditingPoint] = useState<SalesPointType | null>(null)

    const [form] = Form.useForm<SalesPointFormValues>()

    const openCreate = () => {
        setEditingPoint(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const openEdit = (record: SalesPointType) => {
        setEditingPoint(record)
        form.setFieldsValue({
            title: record.title,
            lat: record.location.lat,
            lng: record.location.lng
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const body = {
                title: values.title.trim(),
                location: {
                    lat: values.lat,
                    lng: values.lng
                }
            }

            if (editingPoint) {
                await updateSalesPoint({id: editingPoint.id, body}).unwrap()
                message.success("Точка продаж обновлена")
            } else {
                await createSalesPoint(body).unwrap()
                message.success("Точка продаж создана")
            }

            setIsModalOpen(false)
            setEditingPoint(null)
            form.resetFields()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteSalesPoint(id).unwrap()
            message.success("Точка продаж удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<SalesPointType> = [
        {title: "ID", dataIndex: "id", width: 80},
        {
            title: "Точка продаж",
            dataIndex: "title",
            render: (title: string) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">Используется для филиалов, складов и операционной выдачи</Typography.Text>
                </Space>
            )
        },
        {
            title: "Координаты",
            key: "location",
            width: 240,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Tag color="blue">lat {record.location.lat}</Tag>
                    <Tag color="cyan">lng {record.location.lng}</Tag>
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
                        title="Удалить точку продаж?"
                        description="Проверьте, что она не используется в складах, заказах или интеграциях."
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
        <div>
            <SettingsTableSection
                title="Точки продаж"
                subtitle="Управление филиалами, геопозицией и операционными точками выдачи."
                addButtonText="Добавить точку продаж"
                onAdd={openCreate}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Перед удалением проверьте связи"
                        description="Точки продаж могут использоваться в складах, заказах и будущих Datra-связках. Лучше переименовать точку, если она уже участвовала в операциях."
                    />
                    <Table
                        loading={isLoading}
                        dataSource={data || []}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Точки продаж ещё не добавлены"
                                >
                                    <Button type="primary" onClick={openCreate}>Добавить первую точку</Button>
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editingPoint ? "Редактирование точки продаж" : "Создание точки продаж"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
                okText={editingPoint ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Координаты влияют на карту и операционную выдачу"
                    description="Используйте точные координаты филиала: широта от -90 до 90, долгота от -180 до 180."
                />
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Название"
                        extra="Например: Kokoro ЦУМ или Sakura Mall pickup."
                        rules={[
                            {required: true, message: "Введите название точки продаж"},
                            {whitespace: true, message: "Название не может быть пустым"},
                            {max: 150, message: "Максимум 150 символов"}
                        ]}
                    >
                        <Input placeholder="Kokoro ЦУМ" />
                    </Form.Item>
                    <Form.Item
                        name="lat"
                        label="Широта"
                        rules={[{required: true, message: "Введите широту"}]}
                    >
                        <InputNumber style={{width: "100%"}} step={0.000001} min={-90} max={90} placeholder="41.311081" />
                    </Form.Item>
                    <Form.Item
                        name="lng"
                        label="Долгота"
                        rules={[{required: true, message: "Введите долготу"}]}
                    >
                        <InputNumber style={{width: "100%"}} step={0.000001} min={-180} max={180} placeholder="69.240562" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SalesPointPage
