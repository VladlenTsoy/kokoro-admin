import React, {useState} from "react"
import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation
} from "../../features/settings/sales-point/salesPointApi.ts"
import type {SalesPointType} from "../../features/settings/sales-point/SalesPointTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const SalesPointPage: React.FC = () => {
    const {data, isLoading, isError, refetch} = useGetSalesPointsQuery()
    const [createSalesPoint] = useCreateSalesPointMutation()
    const [updateSalesPoint] = useUpdateSalesPointMutation()
    const [deleteSalesPoint] = useDeleteSalesPointMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPoint, setEditingPoint] = useState<SalesPointType | null>(null)

    const [form] = Form.useForm()

    const openCreateModal = () => {
        setEditingPoint(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        const values = await form.validateFields()
        const body = {
            title: values.title,
            location: {
                lat: values.lat,
                lng: values.lng
            }
        }
        if (editingPoint) {
            await updateSalesPoint({id: editingPoint.id, body})
        } else {
            await createSalesPoint(body)
        }
        setIsModalOpen(false)
        setEditingPoint(null)
        form.resetFields()
    }

    const columns: ColumnsType<SalesPointType> = [
        {
            title: "Точка продаж",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type="secondary">ID точки: {record.id}</Typography.Text>
                </Space>
            )
        },
        {
            title: "Координаты",
            dataIndex: "location",
            render: (location: SalesPointType["location"]) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text>{location.lat}, {location.lng}</Typography.Text>
                    <Typography.Text type="secondary">Широта / долгота для карты и выдачи</Typography.Text>
                </Space>
            )
        },
        {
            title: "Статус",
            dataIndex: "deleted_at",
            width: 140,
            render: (deletedAt?: string | null) => deletedAt ? (
                <Tag color="default">Архив</Tag>
            ) : (
                <Tag color="green">Активна</Tag>
            )
        },
        {
            title: "Действия",
            width: 220,
            render: (_: unknown, record: SalesPointType) => (
                <Space wrap>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingPoint(record)
                            form.setFieldsValue({
                                title: record.title,
                                lat: record.location.lat,
                                lng: record.location.lng
                            })
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить точку продаж?"
                        description="Перед удалением проверьте склады, зоны доставки и заказы, которые могут быть привязаны к этой точке. Если есть история операций, безопаснее сначала отключить её на уровне бизнес-процесса."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteSalesPoint(record.id)}
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
                subtitle="Филиалы, шоурумы и пункты выдачи. Проверяйте координаты перед сохранением — они влияют на карту, самовывоз и складскую привязку."
                addButtonText="Добавить точку продаж"
                onAdd={openCreateModal}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type="info"
                        showIcon
                        message="Операционная подсказка"
                        description="Название должно быть понятным менеджеру в заказе, а координаты — достаточно точными для клиента и курьера. Не удаляйте точки с активными складами или заказами без проверки связей."
                    />
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить точки продаж"
                            description="Повторите загрузку перед изменением филиалов, чтобы не принять решение по устаревшему списку."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    )}
                    <Table<SalesPointType>
                        loading={isLoading}
                        dataSource={data || []}
                        columns={columns}
                        rowKey="id"
                        scroll={{x: 760}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Точки продаж ещё не настроены"
                                >
                                    <Button type="primary" onClick={openCreateModal}>
                                        Добавить первую точку
                                    </Button>
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
                okText={editingPoint ? "Сохранить" : "Создать точку"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Координаты используются в клиентских и менеджерских сценариях"
                    description="После изменения проверьте отображение точки на карте и связь со складами/доставкой, чтобы менеджеры не отправляли клиентов по неверному адресу."
                />
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название точки" rules={[{required: true, message: "Введите название точки продаж"}]}>
                        <Input placeholder="Например: Шоурум ЦУМ" />
                    </Form.Item>
                    <Form.Item
                        name="lat"
                        label="Широта"
                        extra="Диапазон от -90 до 90. Скопируйте координату из проверенной карты."
                        rules={[{required: true, message: "Укажите широту"}]}
                    >
                        <InputNumber style={{width: "100%"}} min={-90} max={90} step={0.000001} placeholder="41.311081" />
                    </Form.Item>
                    <Form.Item
                        name="lng"
                        label="Долгота"
                        extra="Диапазон от -180 до 180. Ошибка в знаке или цифре может увести точку в другой город."
                        rules={[{required: true, message: "Укажите долготу"}]}
                    >
                        <InputNumber style={{width: "100%"}} min={-180} max={180} step={0.000001} placeholder="69.240562" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SalesPointPage
