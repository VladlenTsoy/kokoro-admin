import React, {useMemo, useState} from "react"
import {Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Alert, Empty, Typography, message, Segmented} from "antd"
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
const {Search} = Input

type ColorStatusFilter = "all" | "active" | "archived"

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
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState<ColorStatusFilter>("all")
    const [form] = Form.useForm()

    const activeCount = colors.filter((color) => !color.deleted_at).length
    const archivedCount = colors.length - activeCount
    const normalizedSearch = searchValue.trim().toLowerCase()
    const filteredColors = useMemo(() => colors.filter((color) => {
        const matchesStatus = statusFilter === "all"
            || (statusFilter === "active" && !color.deleted_at)
            || (statusFilter === "archived" && Boolean(color.deleted_at))
        const matchesSearch = !normalizedSearch
            || color.title.toLowerCase().includes(normalizedSearch)
            || color.hex.toLowerCase().includes(normalizedSearch)
            || String(color.id).includes(normalizedSearch)

        return matchesStatus && matchesSearch
    }), [colors, normalizedSearch, statusFilter])

    const resetFilters = () => {
        setSearchValue("")
        setStatusFilter("all")
    }

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
                <div className={styles.summary}>
                    <Tag color="blue">Всего: {colors.length}</Tag>
                    <Tag color="green">Активные: {activeCount}</Tag>
                    <Tag color="red">Удалённые: {archivedCount}</Tag>
                    <Tag color={filteredColors.length === colors.length ? "default" : "gold"}>Показано: {filteredColors.length}</Tag>
                </div>
                <div className={styles.filterBar}>
                    <Text type="secondary">
                        Перед добавлением проверьте название, HEX или ID: дубли похожих цветов усложняют подбор вариантов и комплектацию заказа.
                    </Text>
                    <div className={styles.filterControls}>
                        <Search
                            allowClear
                            placeholder="Поиск по названию, HEX или ID"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            style={{width: 280}}
                        />
                        <Segmented<ColorStatusFilter>
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
                    dataSource={filteredColors}
                    columns={columns}
                    scroll={{x: 720}}
                    pagination={{pageSize: 20, showSizeChanger: true}}
                    locale={{
                        emptyText: searchValue || statusFilter !== "all" ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="По выбранным фильтрам цветов нет"
                            >
                                <Button onClick={resetFilters}>Сбросить фильтры</Button>
                            </Empty>
                        ) : (
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
