import React, {useMemo, useState} from "react"
import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useGetSourcesQuery,
    useCreateSourceMutation,
    useUpdateSourceMutation,
    useDeleteSourceMutation
} from "../../features/source/sourceApi.ts"
import type {SourceType} from "../../features/source/SourceType.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

const {Text} = Typography

const SourcePage: React.FC = () => {
    const {data: sources = [], isLoading, isError, refetch} = useGetSourcesQuery()
    const [createSource, {isLoading: isCreating}] = useCreateSourceMutation()
    const [updateSource, {isLoading: isUpdating}] = useUpdateSourceMutation()
    const [deleteSource, {isLoading: isDeleting}] = useDeleteSourceMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSource, setEditingSource] = useState<SourceType | null>(null)

    const [form] = Form.useForm()

    const activeSourcesCount = useMemo(
        () => sources.filter((source) => source.isActive).length,
        [sources]
    )
    const inactiveSourcesCount = sources.length - activeSourcesCount
    const isSaving = isCreating || isUpdating

    const openCreateModal = () => {
        setEditingSource(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            if (editingSource) {
                await updateSource({id: editingSource.id, body: values}).unwrap()
                message.success("Источник обновлён")
            } else {
                await createSource(values).unwrap()
                message.success("Источник создан")
            }
            setIsModalOpen(false)
            setEditingSource(null)
            form.resetFields()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteSource(id).unwrap()
            message.success("Источник удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
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
        <div>
            <SettingsTableSection
                title="Источники заказов"
                subtitle="Управление каналами поступления заказов: сайт, мессенджеры, маркетплейсы и офлайн-точки."
                addButtonText="Добавить источник"
                onAdd={openCreateModal}
            >
                <Space direction="vertical" size={12} style={{width: "100%", padding: 16, paddingBottom: 0}}>
                    <Alert
                        type="info"
                        showIcon
                        message={`Источники заказов: ${activeSourcesCount} активных, ${inactiveSourcesCount} отключённых`}
                        description="Активные источники помогают быстрее понять, откуда пришёл заказ. Отключайте канал вместо удаления, если по нему уже есть история заказов; удаление используйте только после проверки аналитики и интеграций."
                    />
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить источники заказов"
                            description="Повторите загрузку перед настройкой каналов, чтобы менеджеры не опирались на устаревший список источников."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    )}
                </Space>
                <Table<SourceType>
                    loading={isLoading}
                    dataSource={sources}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Источники заказов ещё не настроены. Добавьте первый канал, чтобы менеджеры видели происхождение заказов."
                            >
                                <Button type="primary" onClick={openCreateModal}>Добавить первый источник</Button>
                            </Empty>
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingSource ? "Редактирование источника" : "Создание источника"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={isSaving}
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
                        extra="Короткий стабильный код для интеграций и аналитики: латиница, цифры, дефис или подчёркивание."
                        rules={[
                            {required: true, message: "Введите код источника"},
                            {pattern: /^[a-z0-9_-]+$/, message: "Используйте только a-z, 0-9, дефис или подчёркивание"}
                        ]}
                    >
                        <Input placeholder="telegram" />
                    </Form.Item>
                    <Text type="secondary">
                        Перед сохранением проверьте, что код совпадает с внешним каналом: это помогает корректно считать заказы в аналитике.
                    </Text>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked" extra="Отключённый источник сохраняет историю, но не должен использоваться для новых заказов.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SourcePage
