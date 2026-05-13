import {
    Alert,
    Button,
    Card,
    Checkbox,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Radio,
    Space,
    Statistic,
    Switch,
    Table,
    Tag,
    Tooltip,
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
import {useGetRolePermissionsQuery, useGetRolesQuery} from "../../features/admin/roleApi.ts"
import type {EmployeeSafe, PermissionAction, PermissionCatalogModule, PermissionCode} from "../../features/auth/authTypes.ts"
import {useCan} from "../../features/auth/permissions.ts"
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

type EmployeeStatusFilter = "all" | "active" | "inactive" | "noRoles"

interface RolesOnlyFormValues {
    roleIds: number[]
}

const PERMISSION_ACTIONS: PermissionAction[] = ["read", "create", "update", "delete", "manage"]

const EMPLOYEE_STATUS_FILTERS: {label: string; value: EmployeeStatusFilter}[] = [
    {label: "Все", value: "all"},
    {label: "Активные", value: "active"},
    {label: "Отключены", value: "inactive"},
    {label: "Без ролей", value: "noRoles"}
]

function summarizePermissions(permissions: PermissionCode[], catalog?: PermissionCatalogModule[]) {
    if (!permissions.length) {
        return "—"
    }

    if (!catalog?.length) {
        return permissions.join(", ")
    }

    return catalog
        .map((module) => {
            const actions = PERMISSION_ACTIONS.filter((action) =>
                permissions.includes(`${module.code}.${action}` as PermissionCode)
            )

            if (!actions.length) {
                return null
            }

            return `${module.title}: ${actions.join(", ")}`
        })
        .filter(Boolean)
        .join("; ") || "—"
}

const EmployeesPage = () => {
    const {
        data: employeesData,
        isLoading: isEmployeesLoading,
        isFetching: isEmployeesFetching,
        error: employeesError,
        refetch: refetchEmployees
    } = useGetEmployeesQuery()
    const {data: rolesData, isLoading: isRolesLoading, isFetching: isRolesFetching, error: rolesError, refetch: refetchRoles} = useGetRolesQuery()
    const {
        data: permissionCatalog,
        isLoading: isPermissionCatalogLoading,
        isFetching: isPermissionCatalogFetching,
        error: permissionCatalogError,
        refetch: refetchPermissionCatalog
    } = useGetRolePermissionsQuery()
    const [createEmployee, {isLoading: isCreating}] = useCreateEmployeeMutation()
    const [updateEmployee, {isLoading: isUpdating}] = useUpdateEmployeeMutation()
    const [updateEmployeeRoles, {isLoading: isUpdatingRoles}] = useUpdateEmployeeRolesMutation()
    const [deleteEmployee, {isLoading: isDeleting}] = useDeleteEmployeeMutation()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<EmployeeSafe | null>(null)
    const [rolesEmployee, setRolesEmployee] = useState<EmployeeSafe | null>(null)
    const [employeeSearch, setEmployeeSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("all")
    const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null)
    const [form] = Form.useForm<EmployeeFormValues>()
    const [rolesForm] = Form.useForm<RolesOnlyFormValues>()
    const editedEmployeeIsActive = Form.useWatch("isActive", form)
    const canManageStaff = useCan("staff.manage")
    const isSavingEmployee = isCreating || isUpdating
    const isSavingRoles = isUpdatingRoles
    const isStaffDirectoryRefreshing = isEmployeesLoading || isEmployeesFetching || isRolesLoading || isRolesFetching || isPermissionCatalogLoading || isPermissionCatalogFetching
    const hasStaffDirectoryError = Boolean(employeesError || rolesError || permissionCatalogError)
    const staffActionsDisabledReason = hasStaffDirectoryError
        ? "Обновите список сотрудников, ролей и матрицу доступов перед изменением прав."
        : isStaffDirectoryRefreshing
            ? "Дождитесь проверки сотрудников, ролей и матрицы доступов, чтобы не сохранить устаревшие права."
            : isSavingEmployee
                ? "Дождитесь сохранения карточки сотрудника."
                : isSavingRoles
                    ? "Дождитесь сохранения ролей сотрудника."
                    : isDeleting
                        ? "Дождитесь удаления сотрудника."
                        : undefined
    const areStaffActionsDisabled = Boolean(staffActionsDisabledReason)

    const employees = useMemo(
        () => (employeesData ? [...employeesData].sort((a, b) => b.id - a.id) : []),
        [employeesData]
    )
    const roles = useMemo(() => (rolesData ? [...rolesData].sort((a, b) => b.id - a.id) : []), [rolesData])
    const normalizedSearch = employeeSearch.trim().toLowerCase()
    const filteredEmployees = useMemo(
        () => employees.filter((employee) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && employee.isActive) ||
                (statusFilter === "inactive" && !employee.isActive) ||
                (statusFilter === "noRoles" && employee.roles.length === 0)

            if (!matchesStatus) {
                return false
            }

            if (!normalizedSearch) {
                return true
            }

            const searchable = [
                employee.email,
                employee.firstName,
                employee.lastName,
                employee.phone ?? "",
                ...employee.roles.map((role) => role.code),
                String(employee.id)
            ].join(" ").toLowerCase()

            return searchable.includes(normalizedSearch)
        }),
        [employees, normalizedSearch, statusFilter]
    )
    const hasEmployeeFilters = Boolean(normalizedSearch) || statusFilter !== "all"

    if (
        getApiStatusCode(employeesError) === 403 ||
        getApiStatusCode(rolesError) === 403 ||
        getApiStatusCode(permissionCatalogError) === 403
    ) {
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
            phone: employee.phone ?? "",
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

    const closeEditModal = () => {
        setEditingEmployee(null)
        setIsEditModalOpen(false)
        form.resetFields()
    }

    const closeRolesModal = () => {
        setRolesEmployee(null)
        setIsRolesModalOpen(false)
        rolesForm.resetFields()
    }

    const handleEditModalCancel = () => {
        if (isSavingEmployee) return
        closeEditModal()
    }

    const handleRolesModalCancel = () => {
        if (isSavingRoles) return
        closeRolesModal()
    }

    const isFormValidationError = (error: unknown) => Boolean(error && typeof error === "object" && "errorFields" in error)

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

            closeEditModal()
        } catch (error) {
            if (isFormValidationError(error)) return
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
            closeRolesModal()
        } catch (error) {
            if (isFormValidationError(error)) return
            message.error(getNestErrorMessage(error))
        }
    }

    const handleDelete = async (id: number) => {
        setDeletingEmployeeId(id)

        try {
            await deleteEmployee(id).unwrap()
            message.success("Сотрудник удалён")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingEmployeeId(null)
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
        {title: "Телефон", dataIndex: "phone", render: (phone?: string | null) => phone || "—"},
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
                    {employee.roles.length ? employee.roles.map((role) => (
                        <Tag key={role.id} color={role.isActive ? "blue" : "default"}>
                            {role.code}
                        </Tag>
                    )) : <Tag color="warning">Роль не назначена</Tag>}
                </Space>
            )
        },
        {
            title: "Доступы",
            dataIndex: "permissions",
            render: (permissions: PermissionCode[]) => summarizePermissions(permissions ?? [], permissionCatalog)
        },
        ...(canManageStaff
            ? [{
                title: "Действия",
                key: "actions",
                width: 320,
                render: (_: unknown, employee: EmployeeSafe) => {
                    const isCurrentEmployeeDeleting = deletingEmployeeId === employee.id
                    const isAnotherEmployeeDeleting = isDeleting && deletingEmployeeId !== null && !isCurrentEmployeeDeleting

                    return (
                        <Space wrap>
                            <Tooltip title={areStaffActionsDisabled ? staffActionsDisabledReason : undefined}>
                                <Button disabled={areStaffActionsDisabled} onClick={() => openEdit(employee)}>Редактировать</Button>
                            </Tooltip>
                            <Tooltip title={areStaffActionsDisabled ? staffActionsDisabledReason : undefined}>
                                <Button disabled={areStaffActionsDisabled} onClick={() => openRolesOnly(employee)}>Только роли</Button>
                            </Tooltip>
                            <Popconfirm
                                title="Удалить сотрудника?"
                                description="Перед удалением проверьте, что у сотрудника нет активной смены, заказов или незавершённой передачи клиенту. Если нужно только закрыть вход, безопаснее сначала выключить активность."
                                onConfirm={() => handleDelete(employee.id)}
                                okText="Удалить"
                                cancelText="Отмена"
                                okButtonProps={{loading: isCurrentEmployeeDeleting}}
                            >
                                <Tooltip title={areStaffActionsDisabled && !isCurrentEmployeeDeleting ? staffActionsDisabledReason : undefined}>
                                    <Button danger loading={isCurrentEmployeeDeleting} disabled={areStaffActionsDisabled || isAnotherEmployeeDeleting}>
                                        {isCurrentEmployeeDeleting ? "Удаляем" : "Удалить"}
                                    </Button>
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    )
                }
            } satisfies ColumnsType<EmployeeSafe>[number]]
            : [])
    ]

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <PageHeading
                title="Сотрудники"
                subtitle="Команда админки, статусы активности и распределение ролей."
                extra={canManageStaff ? (
                    <Tooltip title={areStaffActionsDisabled ? staffActionsDisabledReason : undefined}>
                        <Button type="primary" disabled={areStaffActionsDisabled} onClick={openCreate}>
                            Добавить сотрудника
                        </Button>
                    </Tooltip>
                ) : null}
            />

            <Card>
                <Space size={28}>
                    <Statistic title="Всего сотрудников" value={employees.length} />
                    <Statistic title="Активные" value={employees.filter((employee) => employee.isActive).length} />
                    <Statistic title="Без ролей" value={employees.filter((employee) => employee.roles.length === 0).length} />
                    <Statistic title="Ролей в системе" value={roles.length} />
                    <Statistic title="Модулей доступа" value={permissionCatalog?.length ?? 0} loading={isPermissionCatalogLoading} />
                </Space>
            </Card>

            {(employeesError || rolesError || permissionCatalogError) && (
                <Alert
                    showIcon
                    type="warning"
                    message="Данные по сотрудникам загружены не полностью"
                    description={getNestErrorMessage(employeesError || rolesError || permissionCatalogError)}
                    action={(
                        <Button
                            size="small"
                            onClick={() => {
                                refetchEmployees()
                                refetchRoles()
                                refetchPermissionCatalog()
                            }}
                        >
                            Повторить
                        </Button>
                    )}
                />
            )}

            <Card>
                <Space direction="vertical" size={16} style={{width: "100%"}}>
                    <Space wrap style={{width: "100%", justifyContent: "space-between"}}>
                        <Space direction="vertical" size={4}>
                            <Typography.Text strong>Операционный список доступа</Typography.Text>
                            <Typography.Text type="secondary">
                                Найдите сотрудника по имени, email, телефону, ID или роли перед изменением доступа.
                            </Typography.Text>
                        </Space>
                        <Button disabled={!hasEmployeeFilters} onClick={() => {
                            setEmployeeSearch("")
                            setStatusFilter("all")
                        }}>
                            Сбросить фильтры
                        </Button>
                    </Space>

                    <Space wrap>
                        <Input.Search
                            allowClear
                            value={employeeSearch}
                            placeholder="Поиск: имя, email, телефон, ID или роль"
                            style={{width: 360, maxWidth: "100%"}}
                            onChange={(event) => setEmployeeSearch(event.target.value)}
                        />
                        <Radio.Group
                            optionType="button"
                            buttonStyle="solid"
                            options={EMPLOYEE_STATUS_FILTERS}
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        />
                    </Space>

                    <Typography.Text type="secondary">
                        Показано {filteredEmployees.length} из {employees.length}. Сотрудники без ролей отмечены отдельно — им нужно назначить доступ или отключить вход.
                    </Typography.Text>

                    <Table<EmployeeSafe>
                        rowKey="id"
                        loading={isEmployeesLoading || isRolesLoading || isPermissionCatalogLoading}
                        columns={columns}
                        dataSource={filteredEmployees}
                        pagination={false}
                        scroll={{x: 1100}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasEmployeeFilters ? "По текущим фильтрам сотрудники не найдены" : "Сотрудники ещё не заведены"}
                                >
                                    {hasEmployeeFilters ? (
                                        <Button onClick={() => {
                                            setEmployeeSearch("")
                                            setStatusFilter("all")
                                        }}>
                                            Сбросить фильтры
                                        </Button>
                                    ) : canManageStaff ? (
                                        <Tooltip title={areStaffActionsDisabled ? staffActionsDisabledReason : undefined}>
                                            <Button type="primary" disabled={areStaffActionsDisabled} onClick={openCreate}>Добавить сотрудника</Button>
                                        </Tooltip>
                                    ) : null}
                                </Empty>
                            )
                        }}
                    />
                </Space>
            </Card>

            <Modal
                title={editingEmployee ? "Редактирование сотрудника" : "Создание сотрудника"}
                open={isEditModalOpen}
                onCancel={handleEditModalCancel}
                onOk={handleSubmit}
                confirmLoading={isSavingEmployee}
                okText={isSavingEmployee ? "Сохраняем доступ…" : undefined}
                cancelButtonProps={{disabled: isSavingEmployee}}
                closable={!isSavingEmployee}
                keyboard={!isSavingEmployee}
                maskClosable={!isSavingEmployee}
                width={700}
            >
                <Form<EmployeeFormValues> form={form} layout="vertical" disabled={isSavingEmployee} initialValues={{isActive: true, roleIds: []}}>
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
                        extra="Используйте рабочий номер в международном формате, чтобы менеджера было легче найти в смене."
                        rules={[
                            {required: true, message: "Введите телефон"},
                            {max: 30, message: "Максимум 30 символов"}
                        ]}
                    >
                        <Input autoComplete="tel" placeholder="+998 90 111 22 33" />
                    </Form.Item>
                    <Alert
                        showIcon
                        type="info"
                        style={{marginBottom: 16}}
                        message={editingEmployee ? "Оставьте поле пароля пустым, если доступ менять не нужно" : "Передайте первичный пароль сотруднику по безопасному каналу"}
                        description="Не используйте примеры из интерфейса как реальные пароли. После создания проверьте роли сотрудника и отключите доступ, если он не должен входить в админку."
                    />
                    <Form.Item
                        name="password"
                        label={editingEmployee ? "Новый пароль (опционально)" : "Пароль"}
                        extra={editingEmployee ? "Заполняйте только при сбросе доступа сотрудника." : "Минимум 8 символов; лучше использовать уникальную фразу или пароль из менеджера паролей."}
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
                        <Input.Password autoComplete="new-password" placeholder="Введите временный пароль" />
                    </Form.Item>
                    <Form.Item
                        name="roleIds"
                        label="Роли"
                        rules={[{required: true, message: "Выберите минимум одну роль"}]}
                    >
                        <Checkbox.Group options={roleOptions} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активен" valuePropName="checked">
                        <Switch checkedChildren="Вход открыт" unCheckedChildren="Вход закрыт" />
                    </Form.Item>
                    {editingEmployee && editedEmployeeIsActive === false && (
                        <Alert
                            showIcon
                            type="warning"
                            style={{marginBottom: 16}}
                            message="Вы закрываете сотруднику вход в админку"
                            description="Перед сохранением убедитесь, что его текущие заказы, обращения клиентов и сменные задачи переданы другому менеджеру. Это UI-действие не подтверждает автоматический отзыв всех сессий или операционных обязанностей."
                        />
                    )}
                </Form>
            </Modal>

            <Modal
                title={`Роли: ${rolesEmployee?.firstName ?? ""} ${rolesEmployee?.lastName ?? ""}`.trim()}
                open={isRolesModalOpen}
                onCancel={handleRolesModalCancel}
                onOk={handleRolesSubmit}
                confirmLoading={isSavingRoles}
                okText={isSavingRoles ? "Сохраняем роли…" : undefined}
                cancelButtonProps={{disabled: isSavingRoles}}
                closable={!isSavingRoles}
                keyboard={!isSavingRoles}
                maskClosable={!isSavingRoles}
            >
                <Typography.Paragraph type="secondary">
                    Быстрое обновление ролей через endpoint PATCH /employees/:id/roles
                </Typography.Paragraph>
                <Alert
                    showIcon
                    type="info"
                    style={{marginBottom: 16}}
                    message="Проверьте состав ролей перед сохранением"
                    description="Во время сохранения список ролей блокируется, чтобы не отправить случайно изменённый или частичный набор доступов. Удаление ролей может сразу ограничить рабочие сценарии менеджера."
                />
                <Form<RolesOnlyFormValues> form={rolesForm} layout="vertical" disabled={isSavingRoles}>
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
