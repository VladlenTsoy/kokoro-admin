import React, {useState} from "react"
import {Alert, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag} from "antd"
import type {ColumnsType} from "antd/es/table"
import {
    useCreateProductVariantStatusMutation,
    useGetProductVariantStatusesQuery,
    useUpdateProductVariantStatusMutation,
    useDeleteProductVariantStatusMutation
} from "../../features/product-variant-status/productVariantStatusApi.ts"
import type {ProductVariantStatusType} from "../../features/product-variant-status/ProductVariantStatusType.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const ProductVariantStatusPage: React.FC = () => {
    const {data, isLoading, isError, refetch} = useGetProductVariantStatusesQuery()
    const [createProductVariantStatus] = useCreateProductVariantStatusMutation()
    const [updateProductVariantStatus] = useUpdateProductVariantStatusMutation()
    const [deleteProductVariantStatus] = useDeleteProductVariantStatusMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProductVariantStatus, setEditingProductVariantStatus] = useState<ProductVariantStatusType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        if (editingProductVariantStatus) {
            await updateProductVariantStatus({id: editingProductVariantStatus.id, body: values})
        } else {
            await createProductVariantStatus(values)
        }
        setIsModalOpen(false)
        setEditingProductVariantStatus(null)
        form.resetFields()
    }

    const columns: ColumnsType<ProductVariantStatusType> = [
        {title: "ID", dataIndex: "id", width: 90},
        {
            title: "Статус варианта",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <strong>{title}</strong>
                    <span style={{color: "rgba(0, 0, 0, 0.45)", fontSize: 12}}>Позиция: {record.position ?? "не задана"}</span>
                </Space>
            )
        },
        {
            title: "По умолчанию",
            dataIndex: "is_default",
            width: 160,
            render: (isDefault: boolean) => (
                <Tag color={isDefault ? "blue" : "default"}>{isDefault ? "Да, основной" : "Нет"}</Tag>
            )
        },
        {
            title: "Действия",
            width: 220,
            render: (_: unknown, record: ProductVariantStatusType) => (
                <Space wrap>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingProductVariantStatus(record)
                            form.setFieldsValue(record)
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить статус варианта?"
                        description="Перед удалением убедитесь, что этот статус не используется в активных вариантах товара и фильтрах каталога."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deleteProductVariantStatus(record.id)}
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
                title="Статусы вариантов товара"
                subtitle="Справочник статусов для жизненного цикла товарных вариантов: доступность, витрина, складские состояния."
                addButtonText="Добавить статус варианта"
                onAdd={() => {
                    setEditingProductVariantStatus(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось загрузить статусы вариантов"
                        description="Проверьте подключение или повторите загрузку, чтобы не менять справочник вслепую."
                        action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        style={{margin: 16}}
                    />
                )}
                <Alert
                    type="info"
                    showIcon
                    message="Подсказка для менеджеров каталога"
                    description="Статус по умолчанию подставляется новым вариантам. Меняйте порядок и основной статус аккуратно: это влияет на скорость публикации и фильтрацию товаров."
                    style={{margin: 16}}
                />
                <Table<ProductVariantStatusType>
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 720}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Статусы вариантов ещё не настроены. Добавьте первый статус, чтобы менеджеры понимали состояние SKU в каталоге."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingProductVariantStatus ? "Изменить статус варианта" : "Создать статус варианта"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingProductVariantStatus ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="Статус влияет на работу каталога"
                    description="Не удаляйте и не переименовывайте рабочие статусы без проверки активных вариантов товара и витринных фильтров."
                    style={{marginBottom: 16}}
                />
                <Form form={form} layout="vertical" initialValues={{is_default: false}}>
                    <Form.Item name="title" label="Название" rules={[{required: true, message: "Введите название статуса"}]}>
                        <Input placeholder="Например, В наличии" />
                    </Form.Item>
                    <Form.Item name="position" label="Позиция" extra="Меньшее число поднимает статус выше в списках и селектах.">
                        <InputNumber min={0} style={{width: "100%"}} placeholder="10" />
                    </Form.Item>
                    <Form.Item name="is_default" label="По умолчанию" valuePropName="checked" extra="Используйте только для статуса, который безопасно назначать новым вариантам товара.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductVariantStatusPage
