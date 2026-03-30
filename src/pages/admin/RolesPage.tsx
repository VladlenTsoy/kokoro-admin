import {Button, Card, Form, Input, Modal, Popconfirm, Space, Statistic, Switch, Table, Tag, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import {
    useCreateRoleMutation,
    useDeleteRoleMutation,
    useGetRolesQuery,
    useUpdateRoleMutation
} from "../../features/admin/roleApi.ts"
import type {Role} from "../../features/auth/authTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {getApiStatusCode} from "../../utils/getApiStatusCode.ts"
import ForbiddenPage from "../errors/ForbiddenPage.tsx"
import PageHeading from "../../components/PageHeading.tsx"

interface RoleFormValues {
    code: string
    name: string
    isActive: boolean
}

const RolesPage = () => {
    const {data, isLoading, error} = useGetRolesQuery()
    const [createRole, {isLoading: isCreating}] = useCreateRoleMutation()
    const [updateRole, {isLoading: isUpdating}] = useUpdateRoleMutation()
    const [deleteRole, {isLoading: isDeleting}] = useDeleteRoleMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [form] = Form.useForm<RoleFormValues>()

    const roles = useMemo(() => (data ? [...data].sort((a, b) => b.id - a.id) : []), [data])

    if (getApiStatusCode(error) === 403) {
        return <ForbiddenPage />
    }

    const openCreate = () => {
        setEditingRole(null)
        form.setFieldsValue({code: "", name: "", isActive: true})
        setIsModalOpen(true)
    }

    const openEdit = (role: Role) => {
        setEditingRole(role)
        form.setFieldsValue({
            code: role.code,
            name: role.name,
            isActive: role.isActive
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingRole) {
                await updateRole({
                    id: editingRole.id,
                    code: values.code,
                    name: values.name,
                    isActive: values.isActive
                }).unwrap()
                message.success("Роль обновлена")
            } else {
                await createRole(values).unwrap()
                message.success("Роль создана")
            }

            setIsModalOpen(false)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteRole(id).unwrap()
            message.success("Роль удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<Role> = [
        {title: "ID", dataIndex: "id", width: 70},
        {
            title: "Код",
            dataIndex: "code",
            render: (code: string) => <Tag>{code}</Tag>
        },
        {title: "Название", dataIndex: "name"},
        {
            title: "Статус",
            dataIndex: "isActive",
            render: (isActive: boolean) => (isActive ? <Tag color="green">Активна</Tag> : <Tag color="red">Неактивна</Tag>)
        },
        {
            title: "Действия",
            key: "actions",
            width: 220,
            render: (_, role) => (
                <Space>
                    <Button onClick={() => openEdit(role)}>Редактировать</Button>
                    <Popconfirm
                        title="Удалить роль?"
                        onConfirm={() => handleDelete(role.id)}
                        okButtonProps={{loading: isDeleting}}
                    >
                        <Button danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <PageHeading
                title="Роли"
                subtitle="Управление ролями и уровнем доступа сотрудников."
                extra={(
                    <Button type="primary" onClick={openCreate}>
                        Добавить роль
                    </Button>
                )}
            />

            <Card>
                <Space size={28}>
                    <Statistic title="Всего ролей" value={roles.length} />
                    <Statistic title="Активные" value={roles.filter((role) => role.isActive).length} />
                </Space>
            </Card>

            <Card>
                <Table<Role>
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={roles}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingRole ? "Редактирование роли" : "Создание роли"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
            >
                <Form<RoleFormValues> form={form} layout="vertical" initialValues={{isActive: true}}>
                    <Form.Item
                        name="code"
                        label="Код"
                        normalize={(value: string) => value.toUpperCase()}
                        rules={[
                            {required: true, message: "Введите код"},
                            {max: 50, message: "Максимум 50 символов"}
                        ]}
                    >
                        <Input placeholder="MANAGER" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[
                            {required: true, message: "Введите название"},
                            {max: 100, message: "Максимум 100 символов"}
                        ]}
                    >
                        <Input placeholder="Manager" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активна" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default RolesPage
