import {Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message} from "antd"
import {useMemo, useState} from "react"
import type {ColumnsType} from "antd/es/table"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"
import type {CollectionType} from "../../features/settings/collection/CollectionTypes.ts"
import {
    useCreateCollectionMutation,
    useDeleteCollectionMutation,
    useGetCollectionsQuery,
    useUpdateCollectionMutation
} from "../../features/settings/collection/collectionApi.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"

interface FormValues {
    title: string
}

const CollectionsPage = () => {
    const [form] = Form.useForm<FormValues>()
    const {data, isLoading, isError, refetch} = useGetCollectionsQuery()
    const [createCollection, {isLoading: isCreating}] = useCreateCollectionMutation()
    const [updateCollection, {isLoading: isUpdating}] = useUpdateCollectionMutation()
    const [deleteCollection] = useDeleteCollectionMutation()

    const [isOpen, setIsOpen] = useState(false)
    const [editing, setEditing] = useState<CollectionType | null>(null)
    const [collectionSearch, setCollectionSearch] = useState("")

    const collections = useMemo(() => data ?? [], [data])
    const normalizedSearch = collectionSearch.trim().toLowerCase()
    const filteredCollections = useMemo(
        () => normalizedSearch
            ? collections.filter((collection) =>
                collection.title.toLowerCase().includes(normalizedSearch) || String(collection.id).includes(normalizedSearch)
            )
            : collections,
        [collections, normalizedSearch]
    )
    const hasSearch = normalizedSearch.length > 0

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setIsOpen(true)
    }

    const openEdit = (record: CollectionType) => {
        setEditing(record)
        form.setFieldsValue({title: record.title})
        setIsOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            if (editing) {
                await updateCollection({id: editing.id, title: values.title}).unwrap()
                message.success("Коллекция обновлена")
            } else {
                await createCollection({title: values.title}).unwrap()
                message.success("Коллекция создана")
            }
            setIsOpen(false)
            setEditing(null)
            form.resetFields()
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteCollection(id).unwrap()
            message.success("Коллекция удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<CollectionType> = [
        {
            title: "Коллекция",
            dataIndex: "title",
            render: (title: string, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Space size={6} wrap>
                        <Tag color="blue">ID {record.id}</Tag>
                        <Typography.Text type="secondary">Используется для группировки товаров на витрине</Typography.Text>
                    </Space>
                </Space>
            )
        },
        {
            title: "Создана",
            dataIndex: "createdAt",
            width: 180,
            render: (createdAt?: string) => createdAt
                ? new Date(createdAt).toLocaleDateString("ru-RU")
                : <Typography.Text type="secondary">Нет даты</Typography.Text>
        },
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, record) => (
                <Space wrap>
                    <Button type="link" onClick={() => openEdit(record)}>
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить коллекцию?"
                        description="Проверьте, что коллекция не используется в активных товарах или промо-подборках. Действие нельзя отменить из админки."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => handleDelete(record.id)}
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
                title="Коллекции"
                subtitle="Группируйте товары в понятные подборки для витрины и промо-сценариев."
                addButtonText="Добавить коллекцию"
                onAdd={openCreate}
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {isError ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить коллекции"
                            description="Проверьте подключение или повторите загрузку. Если ошибка сохраняется, не меняйте коллекции вслепую и передайте проблему администратору."
                            action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
                        />
                    ) : null}
                    <Space style={{padding: 16, paddingBottom: 0}} wrap>
                        <Input.Search
                            allowClear
                            placeholder="Поиск по названию или ID"
                            value={collectionSearch}
                            onChange={(event) => setCollectionSearch(event.target.value)}
                            onSearch={setCollectionSearch}
                            style={{width: 280}}
                        />
                        <Tag color="blue">Всего коллекций: {collections.length}</Tag>
                        {hasSearch ? <Tag>Найдено: {filteredCollections.length}</Tag> : null}
                        {hasSearch ? <Button onClick={() => setCollectionSearch("")}>Сбросить поиск</Button> : null}
                    </Space>
                    <Alert
                        type="info"
                        showIcon
                        message="Перед созданием проверьте дубли"
                        description="Поиск помогает быстро найти похожие сезонные, промо и капсульные подборки, чтобы не плодить одинаковые коллекции на витрине."
                    />
                    <Table
                        rowKey="id"
                        loading={isLoading}
                        dataSource={filteredCollections}
                        columns={columns}
                        pagination={false}
                        scroll={{x: 720}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasSearch ? "Коллекции по поиску не найдены" : "Коллекции ещё не созданы"}
                                >
                                    {hasSearch ? (
                                        <Button onClick={() => setCollectionSearch("")}>Сбросить поиск</Button>
                                    ) : (
                                        <Button type="primary" onClick={openCreate}>Создать первую коллекцию</Button>
                                    )}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </SettingsTableSection>

            <Modal
                open={isOpen}
                title={editing ? "Редактировать коллекцию" : "Создать коллекцию"}
                onCancel={() => setIsOpen(false)}
                onOk={handleSave}
                confirmLoading={isCreating || isUpdating}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{marginBottom: 16}}
                    message="Название увидят менеджеры при работе с каталогом"
                    description="Используйте короткое понятное имя: сезон, промо-подборка или капсула. Перед удалением убедитесь, что коллекция не участвует в активной выкладке."
                />
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Название коллекции"
                        extra="Например: «Весна 2026», «Подарки», «Базовая капсула»."
                        rules={[
                            {required: true, message: "Введите название коллекции"},
                            {max: 150, message: "Максимум 150 символов"}
                        ]}
                    >
                        <Input placeholder="Весна 2026" maxLength={150} showCount />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default CollectionsPage
