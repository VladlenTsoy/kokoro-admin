import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, DatePicker, Tag, Typography, message} from "antd"
import {useMemo, useState} from "react"
import type {ColumnsType} from "antd/es/table"
import dayjs from "dayjs"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import type {PromoCode} from "../../features/promo/promoTypes.ts"
import {
    useCreatePromoCodeMutation,
    useDeletePromoCodeMutation,
    useGetPromoCodesQuery,
    useUpdatePromoCodeMutation
} from "../../features/promo/promoApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"

type PromoForm = {
    code: string
    discountType: "percent" | "fixed"
    discountValue: number
    minOrderTotal?: number
    usageLimit?: number
    startsAt?: dayjs.Dayjs
    endsAt?: dayjs.Dayjs
    isActive?: boolean
}

type PromoStatusFilter = "all" | "active" | "scheduled" | "exhausted" | "expired" | "disabled"

const discountTypeLabels: Record<PromoForm["discountType"], string> = {
    percent: "Процент",
    fixed: "Фиксированная сумма"
}

const formatDateTime = (value?: string | null) => value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "—"

const getPromoLifecycleStatus = (promo: PromoCode): Exclude<PromoStatusFilter, "all"> => {
    const now = dayjs()

    if (!promo.isActive) {
        return "disabled"
    }

    if (promo.startsAt && dayjs(promo.startsAt).isAfter(now)) {
        return "scheduled"
    }

    if (promo.endsAt && dayjs(promo.endsAt).isBefore(now)) {
        return "expired"
    }

    if (promo.usageLimit && promo.usedCount !== undefined && promo.usedCount >= promo.usageLimit) {
        return "exhausted"
    }

    return "active"
}

const renderPromoStatus = (promo: PromoCode) => {
    const status = getPromoLifecycleStatus(promo)

    if (status === "disabled") {
        return <Tag color="default">Выключен</Tag>
    }

    if (status === "scheduled") {
        return <Tag color="blue">Запланирован</Tag>
    }

    if (status === "expired") {
        return <Tag color="red">Истёк</Tag>
    }

    if (status === "exhausted") {
        return <Tag color="orange">Лимит исчерпан</Tag>
    }

    return <Tag color="green">Активен</Tag>
}

const PromoCodesPage = () => {
    const {data, isLoading, isFetching, isError, refetch} = useGetPromoCodesQuery()
    const [createPromo, {isLoading: isCreating}] = useCreatePromoCodeMutation()
    const [updatePromo, {isLoading: isUpdating}] = useUpdatePromoCodeMutation()
    const [deletePromo, {isLoading: isDeleting}] = useDeletePromoCodeMutation()
    const [isOpen, setIsOpen] = useState(false)
    const [editing, setEditing] = useState<PromoCode | null>(null)
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState<PromoStatusFilter>("all")
    const [deletingPromoId, setDeletingPromoId] = useState<number | null>(null)
    const [form] = Form.useForm<PromoForm>()
    const isSavingPromo = isCreating || isUpdating
    const isPromoListUnsafe = isLoading || isFetching || isError || !Array.isArray(data)
    const promoCodes = useMemo(() => data || [], [data])
    const promoSummary = useMemo(() => {
        const now = dayjs()
        return promoCodes.reduce(
            (summary, promo) => {
                if (!promo.isActive) {
                    summary.disabled += 1
                } else if (promo.startsAt && dayjs(promo.startsAt).isAfter(now)) {
                    summary.scheduled += 1
                } else if (promo.endsAt && dayjs(promo.endsAt).isBefore(now)) {
                    summary.expired += 1
                } else if (promo.usageLimit && promo.usedCount !== undefined && promo.usedCount >= promo.usageLimit) {
                    summary.exhausted += 1
                } else {
                    summary.active += 1
                }
                return summary
            },
            {active: 0, scheduled: 0, exhausted: 0, expired: 0, disabled: 0}
        )
    }, [promoCodes])
    const normalizedSearch = searchValue.trim().toLowerCase()
    const filteredPromoCodes = useMemo(() => {
        return promoCodes.filter((promo) => {
            const statusMatches = statusFilter === "all" || getPromoLifecycleStatus(promo) === statusFilter
            const searchMatches = !normalizedSearch || [
                promo.id.toString(),
                promo.code,
                promo.discountType,
                discountTypeLabels[promo.discountType]
            ].some((value) => value.toLowerCase().includes(normalizedSearch))

            return statusMatches && searchMatches
        })
    }, [normalizedSearch, promoCodes, statusFilter])
    const hasActiveFilters = Boolean(normalizedSearch) || statusFilter !== "all"

    const resetFilters = () => {
        setSearchValue("")
        setStatusFilter("all")
    }

    const openCreate = () => {
        if (isPromoListUnsafe) {
            return
        }

        setEditing(null)
        form.resetFields()
        form.setFieldsValue({discountType: "percent", isActive: true})
        setIsOpen(true)
    }

    const openEdit = (promo: PromoCode) => {
        if (isPromoListUnsafe) {
            return
        }

        setEditing(promo)
        form.setFieldsValue({
            code: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minOrderTotal: promo.minOrderTotal ?? undefined,
            usageLimit: promo.usageLimit ?? undefined,
            startsAt: promo.startsAt ? dayjs(promo.startsAt) : undefined,
            endsAt: promo.endsAt ? dayjs(promo.endsAt) : undefined,
            isActive: promo.isActive
        })
        setIsOpen(true)
    }

    const savePromo = async () => {
        try {
            const values = await form.validateFields()
            const payload = {
                ...values,
                startsAt: values.startsAt?.toISOString(),
                endsAt: values.endsAt?.toISOString()
            }
            if (editing) {
                await updatePromo({id: editing.id, body: payload}).unwrap()
                message.success("Промокод обновлён")
            } else {
                await createPromo(payload).unwrap()
                message.success("Промокод создан")
            }
            setIsOpen(false)
        } catch (error) {
            if (isAntdFormValidationError(error)) {
                return
            }

            message.error(getNestErrorMessage(error))
        }
    }

    const removePromo = async (id: number) => {
        if (isPromoListUnsafe) {
            return
        }

        setDeletingPromoId(id)
        try {
            await deletePromo(id).unwrap()
            message.success("Промокод удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingPromoId(null)
        }
    }

    const columns: ColumnsType<PromoCode> = [
        {title: "ID", dataIndex: "id", width: 70},
        {
            title: "Промокод",
            dataIndex: "code",
            render: (value: string) => <Typography.Text strong copyable>{value}</Typography.Text>
        },
        {title: "Статус", key: "status", render: (_, promo) => renderPromoStatus(promo)},
        {title: "Тип", dataIndex: "discountType", render: (value: PromoForm["discountType"]) => discountTypeLabels[value] || value},
        {
            title: "Скидка",
            key: "discount",
            render: (_, promo) => promo.discountType === "percent" ? `${promo.discountValue}%` : promo.discountValue
        },
        {title: "Мин. сумма", dataIndex: "minOrderTotal", render: (v) => v ?? "Без ограничения"},
        {title: "Использований", key: "usage", render: (_, promo) => `${promo.usedCount ?? 0} / ${promo.usageLimit ?? "∞"}`},
        {title: "Старт", dataIndex: "startsAt", render: formatDateTime},
        {title: "Финиш", dataIndex: "endsAt", render: formatDateTime},
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, promo) => {
                const isCurrentDeleting = deletingPromoId === promo.id
                const isAnotherPromoDeleting = deletingPromoId !== null && !isCurrentDeleting

                return (
                    <Space wrap>
                        <Button type="link" onClick={() => openEdit(promo)} disabled={isPromoListUnsafe || deletingPromoId !== null}>
                            Редактировать
                        </Button>
                        <Popconfirm
                            title="Удалить промокод?"
                            description="Проверьте, что код не используется в активных маркетинговых коммуникациях."
                            okText={isCurrentDeleting ? "Удаляем..." : "Удалить"}
                            cancelText="Отмена"
                            okButtonProps={{loading: isCurrentDeleting, danger: true, disabled: isPromoListUnsafe}}
                            onConfirm={() => removePromo(promo.id)}
                        >
                            <Button type="link" danger loading={isCurrentDeleting} disabled={isPromoListUnsafe || isAnotherPromoDeleting}>
                                {isCurrentDeleting ? "Удаляем..." : "Удалить"}
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
                title="Промокоды"
                subtitle="Создание и управление скидочными кодами: статус, период действия, лимиты и быстрое копирование кода."
                addButtonText="Добавить промокод"
                onAdd={openCreate}
                addButtonDisabled={isPromoListUnsafe || deletingPromoId !== null || isSavingPromo}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Alert
                        type={promoSummary.expired || promoSummary.exhausted ? "warning" : "info"}
                        showIcon
                        message="Операционный контроль промокодов"
                        description={`Активных: ${promoSummary.active}. Запланированных: ${promoSummary.scheduled}. Исчерпали лимит: ${promoSummary.exhausted}. Истекли: ${promoSummary.expired}. Выключены: ${promoSummary.disabled}. Перед рассылкой проверьте период действия, лимит и минимальную сумму заказа.`}
                    />
                    <Space size={12} wrap style={{width: "100%"}}>
                        <Input.Search
                            allowClear
                            placeholder="Найти промокод по коду, ID или типу скидки"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            style={{maxWidth: 360}}
                        />
                        <Select<PromoStatusFilter>
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{minWidth: 210}}
                            options={[
                                {label: "Все статусы", value: "all"},
                                {label: "Активные", value: "active"},
                                {label: "Запланированные", value: "scheduled"},
                                {label: "Лимит исчерпан", value: "exhausted"},
                                {label: "Истёкшие", value: "expired"},
                                {label: "Выключенные", value: "disabled"}
                            ]}
                        />
                        <Typography.Text type="secondary">
                            Показано {filteredPromoCodes.length} из {promoCodes.length}
                        </Typography.Text>
                        {hasActiveFilters ? <Button onClick={resetFilters}>Сбросить фильтры</Button> : null}
                    </Space>
                    {isPromoListUnsafe && !isError ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Проверяем актуальность промокодов"
                            description="Создание, редактирование и удаление временно заблокированы до подтверждения списка API, чтобы менеджер не изменил устаревший маркетинговый код."
                        />
                    ) : null}
                    {isDeleting && deletingPromoId !== null ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Удаляем промокод"
                            description="Дождитесь завершения операции: создание, редактирование и другие удаления временно заблокированы, чтобы не перепутать активные маркетинговые коды."
                        />
                    ) : null}
                    {isError ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить промокоды"
                            description="Не меняйте маркетинговые рассылки по памяти: обновите список и проверьте актуальные статусы кодов перед запуском акции."
                            action={<Button size="small" onClick={() => refetch()} loading={isFetching}>Повторить</Button>}
                        />
                    ) : null}
                    <Table
                        rowKey="id"
                        loading={isLoading || isFetching}
                        dataSource={filteredPromoCodes}
                        columns={columns}
                        pagination={false}
                        scroll={{x: 980}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasActiveFilters ? "По этим фильтрам промокоды не найдены. Сбросьте фильтры перед созданием нового кода, чтобы не продублировать активную акцию." : "Промокоды ещё не созданы. Добавьте первый код и задайте лимит, период действия и статус активности."}
                                >
                                    {hasActiveFilters ? <Button onClick={resetFilters}>Показать все промокоды</Button> : null}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                title={editing ? "Редактировать промокод" : "Создать промокод"}
                open={isOpen}
                onCancel={() => {
                    if (!isSavingPromo) setIsOpen(false)
                }}
                onOk={savePromo}
                confirmLoading={isSavingPromo}
                okText={isSavingPromo ? "Сохраняем..." : editing ? "Сохранить" : "Создать"}
                cancelButtonProps={{disabled: isSavingPromo}}
                maskClosable={!isSavingPromo}
                keyboard={!isSavingPromo}
                closable={!isSavingPromo}
                width={640}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {isSavingPromo ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Сохраняем промокод"
                            description="Не закрывайте окно и не меняйте условия акции до ответа API, чтобы в рассылку не ушёл частично сохранённый код."
                        />
                    ) : null}
                    <Form form={form} layout="vertical" disabled={isSavingPromo}>
                    <Form.Item name="code" label="Промокод" rules={[{required: true, message: "Введите промокод"}]} tooltip="Используйте понятный код из маркетинговой коммуникации, например MAYSALE10.">
                        <Input placeholder="MAYSALE10" />
                    </Form.Item>
                    <Form.Item name="discountType" label="Тип скидки" rules={[{required: true, message: "Выберите тип скидки"}]}>
                        <Select options={[{label: "Процент", value: "percent"}, {label: "Фиксированная сумма", value: "fixed"}]} />
                    </Form.Item>
                    <Form.Item name="discountValue" label="Значение скидки" rules={[{required: true, message: "Укажите размер скидки"}]}>
                        <InputNumber min={0} style={{width: "100%"}} placeholder="10" />
                    </Form.Item>
                    <Form.Item name="minOrderTotal" label="Минимальная сумма заказа" tooltip="Оставьте пустым, если промокод работает для любого заказа.">
                        <InputNumber min={0} style={{width: "100%"}} placeholder="Без ограничения" />
                    </Form.Item>
                    <Form.Item name="usageLimit" label="Лимит использований" tooltip="Помогает не превысить маркетинговый бюджет.">
                        <InputNumber min={1} style={{width: "100%"}} placeholder="Без лимита" />
                    </Form.Item>
                    <Form.Item name="startsAt" label="Начало действия">
                        <DatePicker showTime style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="endsAt" label="Конец действия">
                        <DatePicker showTime style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </>
    )
}

export default PromoCodesPage
