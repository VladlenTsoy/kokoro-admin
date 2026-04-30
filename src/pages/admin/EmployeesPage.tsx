import {
    Button,
    Card,
    Checkbox,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Statistic,
    Switch,
    Table,
    Tag,
    Typography,
    message
} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import {Navigate} from "react-router-dom"
import {
    useCreateEmployeeMutation,
    useDeleteEmployeeMutation,
    useGetEmployeesQuery,
    useUpdateEmployeeMutation,
    useUpdateEmployeeRolesMutation
} from "../../features/admin/employeeApi.ts"
import {useGetRolesQuery} from "../../features/admin/roleApi.ts"
import type {EmployeeSafe} from "../../features/auth/authTypes.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {getApiStatusCode} from "../../utils/getApiStatusCode.ts"
import PageHeading from "../../components/PageHeading.tsx"

interface EmployeeFormValues {
    email: string
    firstName: string
    lastName: string
    phone: string
    password?: string
    roleIds: number[]
    isActive: boolean
}

interface RolesOnlyFormValues {
    roleIds: number[]
}

const EmployeesPage = () => {
    const {data: employeesData, isLoading: isEmployeesLoading, error: employeesError} = useGetEmployeesQuery()
    const {data: rolesData, isLoading: isRolesLoading, error: rolesError} = useGetRolesQuery()
    const [createEmployee, {isLoading: isCreating}] = useCreateEmployeeMutation()
    const [updateEmployee, {isLoading: isUpdating}] = useUpdateEmployeeMutation()
    const [updateEmployeeRoles, {isLoading: isUpdatingRoles}] = useUpdateEmployeeRolesMutation()
    const [deleteEmployee, {isLoading: isDeleting}] = useDeleteEmployeeMutation()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<EmployeeSafe | null>(null)
    const [rolesEmployee, setRolesEmployee] = useState<EmployeeSafe | null>(null)
    const [form] = Form.useForm<EmployeeFormValues>()
    const [rolesForm] = Form.useForm<RolesOnlyFormValues>()

    const employees = useMemo(
        () => (employeesData ? [...employeesData].sort((a, b) => b.id - a.id) : []),
        [employeesData]
    )
    const roles = useMemo(() => (rolesData ? [...rolesData].sort((a, b) => b.id - a.id) : []), [rolesData])

    if (getApiStatusCode(employeesError) === 403 || getApiStatusCode(rolesError) === 403) {
        return <Navigate to="/forbidden" replace />
    }

    const roleOptions = roles.map((role) => ({
        label: `${role.name} (${role.code})`,
        value: role.id,
        disabled: !role.isActive
    }))

    const openCreate = () => {
        setEditingEmployee(null)
        form.setFieldsValue({
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            password: "",
            roleIds: [],
            isActive: true
        })
        setIsEditModalOpen(true)
    }

    const openEdit = (employee: EmployeeSafe) => {
        setEditingEmployee(employee)
        form.setFieldsValue({
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            roleIds: employee.roles.map((role) => role.id),
            isActive: employee.isActive
        })
        setIsEditModalOpen(true)
    }

    const openRolesOnly = (employee: EmployeeSafe) => {
        setRolesEmployee(employee)
        rolesForm.setFieldsValue({roleIds: employee.roles.map((role) => role.id)})
        setIsRolesModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingEmployee) {
                await updateEmployee({
                    id: editingEmployee.id,
                    email: values.email,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phone: values.phone,
                    roleIds: values.roleIds,
                    isActive: values.isActive,
                    ...(values.password ? {password: values.password} : {})
                }).unwrap()
                message.success("Сотрудник обновлён")
            } else {
                await createEmployee({
                    email: values.email,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phone: values.phone,
                    password: values.password ?? "",
                    roleIds: values.roleIds,
                    isActive: values.isActive
                }).unwrap()
                message.success("Сотрудник создан")
            }

            setIsEditModalOpen(false)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleRolesSubmit = async () => {
        if (!rolesEmployee) {
            return
        }

        try {
            const values = await rolesForm.validateFields()
            await updateEmployeeRoles({id: rolesEmployee.id, roleIds: values.roleIds}).unwrap()
            message.success("Роли сотрудника обновлены")
            setIsRolesModalOpen(false)
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteEmployee(id).unwrap()
            message.success("Сотрудник удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        }
    }

    const columns: ColumnsType<EmployeeSafe> = [
        {title: "ID", dataIndex: "id", width: 70},
        {title: "Email", dataIndex: "email"},
        {
            title: "Имя",
            key: "fullName",
            render: (_, employee) => `${employee.firstName} ${employee.lastName}`
        },
        {title: "Телефон", dataIndex: "phone"},
        {
            title: "Статус",
            dataIndex: "isActive",
            render: (isActive: boolean) => (isActive ? <Tag color="green">Активен</Tag> : <Tag color="red">Неактивен</Tag>)
        },
        {
            title: "Роли",
            key: "roles",
            render: (_, employee) => (
                <Space wrap>
                    {employee.roles.map((role) => (
                        <Tag key={role.id} color={role.isActive ? "blue" : "default"}>
                            {role.code}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Действия",
            key: "actions",
            width: 320,
            render: (_, employee) => (
                <Space>
                    <Button onClick={() => openEdit(employee)}>Редактировать</Button>
                    <Button onClick={() => openRolesOnly(employee)}>Только роли</Button>
                    <Popconfirm
                        title="Удалить сотрудника?"
                        onConfirm={() => handleDelete(employee.id)}
                        okButtonProps={{loading: isDeleting}}
                    >
                        <Button danger>Удалить</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <Space orientation="vertical" size={16} style={{width: "100%"}}>
            <PageHeading
                title="Сотрудники"
                subtitle="Команда админки, статусы активности и распределение ролей."
                extra={(
                    <Button type="primary" onClick={openCreate}>
                        Добавить сотрудника
                    </Button>
                )}
            />

            <Card>
                <Space size={28}>
                    <Statistic title="Всего сотрудников" value={employees.length} />
                    <Statistic title="Активные" value={employees.filter((employee) => employee.isActive).length} />
                    <Statistic title="Ролей в системе" value={roles.length} />
                </Space>
            </Card>

            <Card>
                <Table<EmployeeSafe>
                    rowKey="id"
                    loading={isEmployeesLoading || isRolesLoading}
                    columns={columns}
                    dataSource={employees}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingEmployee ? "Редактирование сотрудника" : "Создание сотрудника"}
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={isCreating || isUpdating}
                width={700}
            >
                <Form<EmployeeFormValues> form={form} layout="vertical" initialValues={{isActive: true, roleIds: []}}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            {required: true, message: "Введите email"},
                            {type: "email", message: "Неверный формат email"}
                        ]}
                    >
                        <Input placeholder="john.doe@kokoro.uz" />
                    </Form.Item>
                    <Form.Item
                        name="firstName"
                        label="Имя"
                        rules={[
                            {required: true, message: "Введите имя"},
                            {max: 100, message: "Максимум 100 символов"}
                        ]}
                    >
                        <Input placeholder="John" />
                    </Form.Item>
                    <Form.Item
                        name="lastName"
                        label="Фамилия"
                        rules={[
                            {required: true, message: "Введите фамилию"},
                            {max: 100, message: "Максимум 100 символов"}
                        ]}
                    >
                        <Input placeholder="Doe" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Телефон"
                        rules={[
                            {required: true, message: "Введите телефон"},
                            {max: 30, message: "Максимум 30 символов"}
                        ]}
                    >
                        <Input placeholder="+998901112233" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={editingEmployee ? "Новый пароль (опционально)" : "Пароль"}
                        rules={
                            editingEmployee
                                ? [
                                    {min: 8, message: "Минимум 8 символов"},
                                    {max: 100, message: "Максимум 100 символов"}
                                ]
                                : [
                                    {required: true, message: "Введите пароль"},
                                    {min: 8, message: "Минимум 8 символов"},
                                    {max: 100, message: "Максимум 100 символов"}
                                ]
                        }
                    >
                        <Input.Password placeholder="StrongPassword123" />
                    </Form.Item>
                    <Form.Item
                        name="roleIds"
                        label="Роли"
                        rules={[{required: true, message: "Выберите минимум одну роль"}]}
                    >
                        <Checkbox.Group options={roleOptions} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Роли: ${rolesEmployee?.firstName ?? ""} ${rolesEmployee?.lastName ?? ""}`.trim()}
                open={isRolesModalOpen}
                onCancel={() => setIsRolesModalOpen(false)}
                onOk={handleRolesSubmit}
                confirmLoading={isUpdatingRoles}
            >
                <Typography.Paragraph type="secondary">
                    Быстрое обновление ролей через endpoint PATCH /employees/:id/roles
                </Typography.Paragraph>
                <Form<RolesOnlyFormValues> form={rolesForm} layout="vertical">
                    <Form.Item
                        name="roleIds"
                        label="Роли"
                        rules={[{required: true, message: "Выберите минимум одну роль"}]}
                    >
                        <Checkbox.Group options={roleOptions} />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}

export default EmployeesPage
