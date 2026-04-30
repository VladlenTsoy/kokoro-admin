import {Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, DatePicker, message} from "antd"
import {useState} from "react"
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

const PromoCodesPage = () => {
    const {data, isLoading} = useGetPromoCodesQuery()
    const [createPromo, {isLoading: isCreating}] = useCreatePromoCodeMutation()
    const [updatePromo, {isLoading: isUpdating}] = useUpdatePromoCodeMutation()
    const [deletePromo] = useDeletePromoCodeMutation()
    const [isOpen, setIsOpen] = useState(false)
    const [editing, setEditing] = useState<PromoCode | null>(null)
    const [form] = Form.useForm<PromoForm>()

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        form.setFieldsValue({discountType: "percent", isActive: true})
        setIsOpen(true)
    }

    const openEdit = (promo: PromoCode) => {
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
            message.error(getNestErrorMessage(error))
        }
    }

    const removePromo = async (id: number) => {
        try {
            await deletePromo(id).unwrap()
            message.success("Промокод удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<PromoCode> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Code", dataIndex: "code"},
        {title: "Тип", dataIndex: "discountType"},
        {title: "Значение", dataIndex: "discountValue"},
        {title: "Мин. сумма", dataIndex: "minOrderTotal", render: (v) => v ?? "—"},
        {title: "Лимит", dataIndex: "usageLimit", render: (v) => v ?? "—"},
        {title: "Использовано", dataIndex: "usedCount", render: (v) => v ?? "—"},
        {title: "Активен", dataIndex: "isActive", render: (v) => (v ? "Да" : "Нет")},
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, promo) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(promo)}>Редактировать</Button>
                    <Popconfirm title="Удалить промокод?" onConfirm={() => removePromo(promo.id)}>
                        <Button type="link" danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <SettingsTableSection
                title="Промокоды"
                subtitle="Создание и управление скидочными кодами."
                addButtonText="Добавить промокод"
                onAdd={openCreate}
            >
                <Table rowKey="id" loading={isLoading} dataSource={data || []} columns={columns} pagination={false} />
            </SettingsTableSection>

            <Modal
                title={editing ? "Редактировать промокод" : "Создать промокод"}
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                onOk={savePromo}
                confirmLoading={isCreating || isUpdating}
                width={640}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="code" label="Code" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="discountType" label="Тип скидки" rules={[{required: true}]}>
                        <Select options={[{label: "percent", value: "percent"}, {label: "fixed", value: "fixed"}]} />
                    </Form.Item>
                    <Form.Item name="discountValue" label="Значение скидки" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="minOrderTotal" label="Минимальная сумма заказа">
                        <InputNumber style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="usageLimit" label="Лимит использований">
                        <InputNumber style={{width: "100%"}} />
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
            </Modal>
        </>
    )
}

export default PromoCodesPage
