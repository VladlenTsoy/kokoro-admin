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
    const {data, isLoading} = useGetProductVariantStatusesQuery()
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
                    <Space wrap>
                        <strong>{title}</strong>
                        {record.is_default && <Tag color="blue">По умолчанию</Tag>}
                    </Space>
                    <span style={{color: "rgba(0, 0, 0, 0.45)", fontSize: 12}}>Позиция: {record.position ?? "—"}</span>
                </Space>
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
                        title="Удалить статус?"
                        description="Перед удалением проверьте, что этот статус не используется в вариантах товара."
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
                subtitle="Справочник статусов для жизненного цикла товарных вариантов: продажа, склад, скрытие и служебные состояния."
                addButtonText="Добавить статус продукта"
                onAdd={() => {
                    setEditingProductVariantStatus(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Alert
                    type="info"
                    showIcon
                    message="Как это влияет на менеджеров"
                    description="Статус варианта помогает быстро понять, можно ли продавать конкретный размер/цвет. Держите один понятный статус по умолчанию и используйте позицию для порядка отображения."
                    style={{margin: 16}}
                />
                <Table<ProductVariantStatusType>
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{x: 680}}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Статусы вариантов ещё не настроены. Добавьте первый статус, чтобы менеджеры видели состояние товарных вариантов."
                            />
                        )
                    }}
                />
            </SettingsTableSection>

            <Modal
                title={editingProductVariantStatus ? "Изменить статус продукта" : "Создать статус продукта"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingProductVariantStatus ? "Сохранить" : "Создать"}
                cancelText="Отмена"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="Меняйте статус по умолчанию аккуратно"
                    description="Новый статус по умолчанию может повлиять на создание товарных вариантов и работу каталога."
                    style={{marginBottom: 16}}
                />
                <Form form={form} layout="vertical" initialValues={{is_default: false}}>
                    <Form.Item name="title" label="Название" rules={[{required: true, message: "Введите название статуса"}]}>
                        <Input placeholder="Например, В продаже" />
                    </Form.Item>
                    <Form.Item name="position" label="Позиция" extra="Чем меньше число, тем выше статус в списках.">
                        <InputNumber min={0} style={{width: "100%"}} placeholder="100" />
                    </Form.Item>
                    <Form.Item name="is_default" label="По умолчанию" valuePropName="checked" extra="Используется как начальное состояние для новых вариантов, если backend поддерживает это правило.">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductVariantStatusPage
