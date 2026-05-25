import React, {useMemo, useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Alert, Empty, Typography, message, Segmented} from "antd"
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
const {Search} = Input

type SizeStatusFilter = "all" | "active" | "archived"

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
    },
    formHint: {
        display: "block",
        marginTop: token.marginXXS
    }
}))

const SizePage: React.FC = () => {
    const {styles} = useStyles()
    const {data: sizes = [], isLoading, isFetching, isError, refetch} = useGetSizesQuery()
    const [createSize, {isLoading: isCreating}] = useCreateSizeMutation()
    const [updateSize, {isLoading: isUpdating}] = useUpdateSizeMutation()
    const [deleteSize, {isLoading: isDeleting}] = useDeleteSizeMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSize, setEditingSize] = useState<SizeType | null>(null)
    const [deletingSizeId, setDeletingSizeId] = useState<number | null>(null)
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState<SizeStatusFilter>("all")
    const [form] = Form.useForm()

    const isSaving = isCreating || isUpdating
    const isMutationLocked = isSaving || isDeleting
    const isSizeListRefreshing = isLoading || isFetching
    const isSizeListUnavailable = isError
    const areSizeActionsBlocked = isMutationLocked || isSizeListRefreshing || isSizeListUnavailable
    const sizeActionsDisabledReason = isSizeListUnavailable
        ? "Повторите загрузку размеров перед изменениями: список не подтверждён API."
        : isSizeListRefreshing
            ? "Дождитесь обновления списка размеров, чтобы не изменить устаревшую размерную сетку."
            : isSaving
                ? "Дождитесь сохранения текущего размера."
                : isDeleting
                    ? "Дождитесь завершения удаления размера."
                    : undefined
    const activeCount = sizes.filter((size) => !size.deleted_at).length
    const archivedCount = sizes.length - activeCount
    const normalizedSearch = searchValue.trim().toLowerCase()
    const filteredSizes = useMemo(() => sizes.filter((size) => {
        const matchesStatus = statusFilter === "all"
            || (statusFilter === "active" && !size.deleted_at)
            || (statusFilter === "archived" && Boolean(size.deleted_at))
        const matchesSearch = !normalizedSearch
            || size.title.toLowerCase().includes(normalizedSearch)
            || String(size.id).includes(normalizedSearch)

        return matchesStatus && matchesSearch
    }), [normalizedSearch, sizes, statusFilter])

    const resetFilters = () => {
        setSearchValue("")
        setStatusFilter("all")
    }

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
        setDeletingSizeId(id)
        try {
            await deleteSize(id).unwrap()
            message.success("Размер удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingSizeId(null)
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
            render: (_: unknown, record: SizeType) => {
                const isCurrentDeleting = deletingSizeId === record.id
                const sizeStatusLabel = record.deleted_at ? "удалённый" : "активный"
                const sizeActionContext = `размер «${record.title}», ID ${record.id}, ${sizeStatusLabel}`
                const editSizeLabel = sizeActionsDisabledReason || `Редактировать ${sizeActionContext}`
                const deleteSizeLabel = isCurrentDeleting
                    ? `Удаляем ${sizeActionContext}`
                    : sizeActionsDisabledReason || `Удалить ${sizeActionContext}`

                return (
                    <Space>
                        <Button
                            type="link"
                            disabled={areSizeActionsBlocked}
                            aria-label={editSizeLabel}
                            title={editSizeLabel}
                            onClick={() => {
                                setEditingSize(record)
                                form.setFieldsValue(record)
                                setIsModalOpen(true)
                            }}
                        >
                            Редактировать
                        </Button>
                        <Popconfirm
                            title={`Удалить размер «${record.title}»?`}
                            description={`Проверьте, что размер ID ${record.id} не используется в активных товарах. Удаление может убрать вариант из выбора менеджеров и карточек заказа.`}
                            okText={isCurrentDeleting ? "Удаляем…" : "Удалить"}
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{loading: isCurrentDeleting}}
                            cancelButtonProps={{disabled: isCurrentDeleting}}
                        >
                            <Button
                                type="link"
                                danger
                                loading={isCurrentDeleting}
                                disabled={areSizeActionsBlocked && !isCurrentDeleting}
                                aria-label={deleteSizeLabel}
                                title={deleteSizeLabel}
                            >
                                {isCurrentDeleting ? "Удаляем…" : "Удалить"}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Размеры"
                subtitle="Управляйте размерной сеткой каталога: названия должны быть короткими, единообразными и понятными менеджерам при подборе товара."
                addButtonText="Добавить размер"
                addButtonDisabled={areSizeActionsBlocked}
                addButtonDisabledReason={sizeActionsDisabledReason}
                onAdd={() => {
                    setEditingSize(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <div className={styles.summary}>
                    <Tag color="blue">Всего: {sizes.length}</Tag>
                    <Tag color="green">Активные: {activeCount}</Tag>
                    <Tag color="red">Удалённые: {archivedCount}</Tag>
                    <Tag color={filteredSizes.length === sizes.length ? "default" : "gold"}>Показано: {filteredSizes.length}</Tag>
                </div>
                <div className={styles.filterBar}>
                    <Text type="secondary">
                        Быстро найдите размер перед созданием нового, чтобы не завести дубль в размерной сетке.
                    </Text>
                    <div className={styles.filterControls}>
                        <Search
                            allowClear
                            placeholder="Поиск по названию или ID"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            style={{width: 260}}
                        />
                        <Segmented<SizeStatusFilter>
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                {label: "Все", value: "all"},
                                {label: "Активные", value: "active"},
                                {label: "Удалённые", value: "archived"}
                            ]}
                        />
                        <Button disabled={!searchValue && statusFilter === "all"} onClick={resetFilters}>
                            Сбросить
                        </Button>
                    </div>
                </div>
                {isDeleting && deletingSizeId !== null && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Удаляем размер"
                        description="Дождитесь завершения операции: редактирование и другие удаления временно заблокированы, чтобы не смешать изменения в размерной сетке."
                    />
                )}
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить размеры"
                        description="Проверьте подключение или повторите загрузку: создание, редактирование и удаление размеров заблокированы, чтобы менеджеры не меняли старый справочник."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                    />
                )}
                <Table
                    rowKey="id"
                    loading={isSizeListRefreshing}
                    dataSource={filteredSizes}
                    columns={columns}
                    scroll={{x: 640}}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                    locale={{
                        emptyText: searchValue || statusFilter !== "all" ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="По выбранным фильтрам размеров нет"
                            >
                                <Button onClick={resetFilters}>Сбросить фильтры</Button>
                            </Empty>
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Размеры пока не добавлены"
                            >
                                <Button
                                    type="primary"
                                    disabled={areSizeActionsBlocked}
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
                onCancel={() => {
                    if (!isSaving) {
                        setIsModalOpen(false)
                    }
                }}
                onOk={handleSave}
                okText={isSaving ? "Сохраняем…" : editingSize ? "Сохранить размер" : "Добавить размер"}
                cancelButtonProps={{disabled: isSaving}}
                maskClosable={!isSaving}
                keyboard={!isSaving}
                confirmLoading={isSaving}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название"
                        name="title"
                        extra="Используйте формат, который менеджер сразу узнает в карточке товара и заказе: XS, S, M, 42, One Size."
                        rules={[{required: true, message: "Введите название"}]}
                    >
                        <Input placeholder="Например: M" disabled={isSaving} />
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
