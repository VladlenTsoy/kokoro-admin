import React, {useState} from "react"
import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag} from "antd"
import type {ColumnsType} from "antd/es/table"
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

    const columns: ColumnsType<SourceType> = [
        {title: "ID", dataIndex: "id", width: 90},
        {
            title: "Источник",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <strong>{title}</strong>
                    <span style={{color: "rgba(0, 0, 0, 0.45)", fontSize: 12}}>Код: {record.code}</span>
                </Space>
            )
        },
        {
            title: "Статус",
            dataIndex: "isActive",
            width: 140,
            render: (val: boolean) => (
                <Tag color={val ? "green" : "default"}>{val ? "Активен" : "Отключён"}</Tag>
            )
        },
        {
            title: "Действия",
            width: 220,
            render: (_: unknown, record: SourceType) => (
                <Space wrap>
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
                    <Popconfirm
                        title="Удалить источник?"
                        description="Перед удалением убедитесь, что источник не используется в заказах и аналитике."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteSource(record.id)}
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
                title="Источники заказов"
                subtitle="Управление каналами поступления заказов: сайт, мессенджеры, маркетплейсы и офлайн-точки."
                addButtonText="Добавить источник"
                onAdd={() => {
                    setEditingSource(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Alert
                    type="info"
                    showIcon
                    message="Подсказка для менеджеров"
                    description="Активные источники помогают быстрее понять, откуда пришёл заказ. Отключайте канал вместо удаления, если по нему уже есть история заказов."
                    style={{margin: 16}}
                />
                <Table<SourceType>
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Источники заказов ещё не настроены. Добавьте первый канал, чтобы менеджеры видели происхождение заказов."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingSource ? "Редактирование источника" : "Создание источника"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingSource ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="Код источника может использоваться в интеграциях и отчётах"
                    description="Меняйте его только если уверены, что внешний канал и аналитика готовы к новому значению."
                    style={{marginBottom: 16}}
                />
                <Form form={form} layout="vertical" initialValues={{isActive: true}}>
                    <Form.Item name="title" label="Название" rules={[{required: true, message: "Введите название источника"}]}>
                        <Input placeholder="Например, Telegram" />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="Код"
                        extra="Короткий стабильный код для интеграций и аналитики, например telegram или site."
                        rules={[{required: true, message: "Введите код источника"}]}
                    >
                        <Input placeholder="telegram" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked" extra="Отключённый источник сохраняет историю, но не должен использоваться для новых заказов.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SourcePage
