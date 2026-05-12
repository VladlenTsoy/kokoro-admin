import React, {useMemo, useState} from "react"
import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Segmented, Space, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {createStyles} from "antd-style"
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
const {Search} = Input

type SourceStatusFilter = "all" | "active" | "inactive"

const useStyles = createStyles(({token}) => ({
    summary: {
        display: "flex",
        flexWrap: "wrap",
        gap: token.marginSM,
        marginBottom: token.marginMD
    },
    filterBar: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: token.marginSM,
        marginBottom: token.marginMD
    },
    filterControls: {
        display: "flex",
        flexWrap: "wrap",
        gap: token.marginSM
    }
}))

const SourcePage: React.FC = () => {
    const {styles} = useStyles()
    const {data: sources = [], isLoading, isError, refetch} = useGetSourcesQuery()
    const [createSource, {isLoading: isCreating}] = useCreateSourceMutation()
    const [updateSource, {isLoading: isUpdating}] = useUpdateSourceMutation()
    const [deleteSource, {isLoading: isDeleting}] = useDeleteSourceMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSource, setEditingSource] = useState<SourceType | null>(null)
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState<SourceStatusFilter>("all")
    const [deletingSourceId, setDeletingSourceId] = useState<number | null>(null)

    const [form] = Form.useForm()

    const activeSourcesCount = useMemo(
        () => sources.filter((source) => source.isActive).length,
        [sources]
    )
    const inactiveSourcesCount = sources.length - activeSourcesCount
    const normalizedSearch = searchValue.trim().toLowerCase()
    const filteredSources = useMemo(() => sources.filter((source) => {
        const matchesStatus = statusFilter === "all"
            || (statusFilter === "active" && source.isActive)
            || (statusFilter === "inactive" && !source.isActive)
        const matchesSearch = !normalizedSearch
            || source.title.toLowerCase().includes(normalizedSearch)
            || source.code.toLowerCase().includes(normalizedSearch)
            || String(source.id).includes(normalizedSearch)

        return matchesStatus && matchesSearch
    }), [normalizedSearch, sources, statusFilter])
    const hasActiveFilters = Boolean(searchValue) || statusFilter !== "all"
    const isSaving = isCreating || isUpdating
    const isSourceMutationLocked = isSaving || isDeleting
    const modalOkText = isSaving ? "Сохраняем…" : editingSource ? "Сохранить" : "Создать"

    const resetFilters = () => {
        setSearchValue("")
        setStatusFilter("all")
    }

    const openCreateModal = () => {
        if (isSourceMutationLocked) {
            return
        }
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

    const handleCloseModal = () => {
        if (isSaving) {
            return
        }
        setIsModalOpen(false)
    }

    const handleDelete = async (id: number) => {
        setDeletingSourceId(id)
        try {
            await deleteSource(id).unwrap()
            message.success("Источник удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingSourceId(null)
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
            render: (_: unknown, record: SourceType) => {
                const isCurrentSourceDeleting = deletingSourceId === record.id
                const isAnotherSourceDeleting = isDeleting && !isCurrentSourceDeleting

                return (
                    <Space wrap>
                        <Button
                            type="link"
                            disabled={isSourceMutationLocked}
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
                            okText={isCurrentSourceDeleting ? "Удаляем…" : "Удалить"}
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{loading: isCurrentSourceDeleting}}
                        >
                            <Button type="link" danger loading={isCurrentSourceDeleting} disabled={isAnotherSourceDeleting}>
                                {isCurrentSourceDeleting ? "Удаляем…" : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Источники заказов"
                subtitle="Управление каналами поступления заказов: сайт, мессенджеры, маркетплейсы и офлайн-точки."
                addButtonText="Добавить источник"
                onAdd={openCreateModal}
                addButtonDisabled={isSourceMutationLocked}
            >
                <Space direction="vertical" size={12} style={{width: "100%", padding: 16, paddingBottom: 0}}>
                    <Alert
                        type="info"
                        showIcon
                        message={`Источники заказов: ${activeSourcesCount} активных, ${inactiveSourcesCount} отключённых`}
                        description="Активные источники помогают быстрее понять, откуда пришёл заказ. Отключайте канал вместо удаления, если по нему уже есть история заказов; удаление используйте только после проверки аналитики и интеграций."
                    />
                    <div className={styles.summary}>
                        <Tag color="blue">Всего: {sources.length}</Tag>
                        <Tag color="green">Активные: {activeSourcesCount}</Tag>
                        <Tag>Отключённые: {inactiveSourcesCount}</Tag>
                        <Tag color={filteredSources.length === sources.length ? "default" : "gold"}>Показано: {filteredSources.length}</Tag>
                    </div>
                    <div className={styles.filterBar}>
                        <Text type="secondary">
                            Найдите источник по названию, коду или ID перед созданием нового канала, чтобы не дублировать аналитику заказов.
                        </Text>
                        <div className={styles.filterControls}>
                            <Search
                                allowClear
                                placeholder="Поиск по названию, коду или ID"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                style={{width: 280}}
                            />
                            <Segmented<SourceStatusFilter>
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    {label: "Все", value: "all"},
                                    {label: "Активные", value: "active"},
                                    {label: "Отключённые", value: "inactive"}
                                ]}
                            />
                            <Button disabled={!hasActiveFilters} onClick={resetFilters}>Сбросить</Button>
                        </div>
                    </div>
                    {isDeleting && deletingSourceId !== null ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Удаление источника выполняется"
                            description="Пока канал удаляется, создание и редактирование источников заблокированы, чтобы не смешать изменения в аналитике и интеграциях."
                        />
                    ) : null}
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
                    dataSource={filteredSources}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: hasActiveFilters ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="По выбранным фильтрам источников нет"
                            >
                                <Button onClick={resetFilters}>Сбросить фильтры</Button>
                            </Empty>
                        ) : (
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
                onCancel={handleCloseModal}
                onOk={handleSubmit}
                confirmLoading={isSaving}
                okText={modalOkText}
                cancelText="Отмена"
                cancelButtonProps={{disabled: isSaving}}
                maskClosable={!isSaving}
                closable={!isSaving}
            >
                <Alert
                    type={isSaving ? "info" : "warning"}
                    showIcon
                    message={isSaving ? "Сохраняем источник заказов" : "Код источника может использоваться в интеграциях и отчётах"}
                    description={isSaving
                        ? "Поля временно заблокированы, чтобы не отправить частично изменённый канал аналитики."
                        : "Меняйте его только если уверены, что внешний канал и аналитика готовы к новому значению."}
                    style={{marginBottom: 16}}
                />
                <Form form={form} layout="vertical" initialValues={{isActive: true}} disabled={isSaving}>
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
