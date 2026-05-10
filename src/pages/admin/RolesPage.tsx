import {Alert, Button, Card, Checkbox, Drawer, Empty, Form, Input, Popconfirm, Segmented, Space, Statistic, Switch, Table, Tag, Typography, message} from "antd"
import type {ColumnsType} from "antd/es/table"
import {useMemo, useState} from "react"
import {Navigate} from "react-router-dom"
import {
    useCreateRoleMutation,
    useDeleteRoleMutation,
    useGetRolePermissionsQuery,
    useGetRolesQuery,
    useUpdateRoleMutation
} from "../../features/admin/roleApi.ts"
import type {PermissionAction, PermissionCatalogModule, PermissionCode, Role} from "../../features/auth/authTypes.ts"
import {useCan} from "../../features/auth/permissions.ts"
import {getNestErrorMessage} from "../../utils/getNestErrorMessage.ts"
import {getApiStatusCode} from "../../utils/getApiStatusCode.ts"
import PageHeading from "../../components/PageHeading.tsx"

interface RoleFormValues {
    code: string
    name: string
    isActive: boolean
    permissions: PermissionCode[]
}

type RoleStatusFilter = "all" | "active" | "inactive" | "withoutPermissions"

const ACTIONS: PermissionAction[] = ["read", "create", "update", "delete", "manage"]
const ACTION_LABELS: Record<PermissionAction, string> = {
    read: "Read",
    create: "Create",
    update: "Update",
    delete: "Delete",
    manage: "Manage"
}

function togglePermission(selectedPermissions: PermissionCode[], permission: PermissionCode) {
    return selectedPermissions.includes(permission)
        ? selectedPermissions.filter((item) => item !== permission)
        : [...selectedPermissions, permission]
}

function summarizePermissions(permissions: PermissionCode[], catalog?: PermissionCatalogModule[]) {
    if (!permissions.length) {
        return "—"
    }

    if (!catalog?.length) {
        return permissions.join(", ")
    }

    return catalog
        .map((module) => {
            const moduleActions = ACTIONS.filter((action) =>
                permissions.includes(`${module.code}.${action}` as PermissionCode)
            )

            if (!moduleActions.length) {
                return null
            }

            return `${module.title}: ${moduleActions.map((action) => action.toLowerCase()).join(", ")}`
        })
        .filter(Boolean)
        .join("; ") || "—"
}

interface PermissionMatrixProps {
    catalog?: PermissionCatalogModule[]
    selectedPermissions: PermissionCode[]
    onToggle: (permission: PermissionCode) => void
}

const PermissionMatrix = ({catalog, selectedPermissions, onToggle}: PermissionMatrixProps) => {
    if (!catalog?.length) {
        return (
            <Alert
                type="info"
                showIcon
                message="Каталог доступов пока не загружен"
                description="Фронт не хардкодит permissions и ждёт ответ GET /admin/roles/permissions."
            />
        )
    }

    return (
        <Table<PermissionCatalogModule>
            rowKey="code"
            size="small"
            pagination={false}
            dataSource={catalog}
            scroll={{x: 720}}
            columns={[
                {
                    title: "Модуль",
                    key: "module",
                    fixed: "left",
                    width: 220,
                    render: (_, module) => (
                        <div>
                            <Typography.Text strong>{module.title}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary">{module.description}</Typography.Text>
                        </div>
                    )
                },
                ...ACTIONS.map((action) => ({
                    title: ACTION_LABELS[action],
                    key: action,
                    align: "center" as const,
                    width: 110,
                    render: (_: unknown, module: PermissionCatalogModule) => {
                        const permission = module.permissions.find((item) => item.action === action)
                        const managePermission = module.permissions.find((item) => item.action === "manage")
                        const isManageSelected = Boolean(
                            managePermission && selectedPermissions.includes(managePermission.code)
                        )

                        if (!permission) {
                            return <Typography.Text type="secondary">—</Typography.Text>
                        }

                        return (
                            <Checkbox
                                checked={selectedPermissions.includes(permission.code) || (action !== "manage" && isManageSelected)}
                                disabled={action !== "manage" && isManageSelected}
                                onChange={() => onToggle(permission.code)}
                            />
                        )
                    }
                }))
            ]}
        />
    )
}

const RolesPage = () => {
    const {data, isLoading, error} = useGetRolesQuery()
    const {
        data: permissionCatalog,
        isLoading: isPermissionCatalogLoading,
        error: permissionCatalogError,
        refetch: refetchPermissionCatalog
    } = useGetRolePermissionsQuery()
    const [createRole, {isLoading: isCreating}] = useCreateRoleMutation()
    const [updateRole, {isLoading: isUpdating}] = useUpdateRoleMutation()
    const [deleteRole, {isLoading: isDeleting}] = useDeleteRoleMutation()

    const canManageStaff = useCan("staff.manage")
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [statusFilter, setStatusFilter] = useState<RoleStatusFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [form] = Form.useForm<RoleFormValues>()
    const selectedPermissions = Form.useWatch("permissions", form) ?? []

    const roles = useMemo(() => (data ? [...data].sort((a, b) => b.id - a.id) : []), [data])
    const filteredRoles = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase()

        return roles.filter((role) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && role.isActive) ||
                (statusFilter === "inactive" && !role.isActive) ||
                (statusFilter === "withoutPermissions" && !role.permissions.length)

            if (!matchesStatus) {
                return false
            }

            if (!normalizedQuery) {
                return true
            }

            return [role.code, role.name, ...(role.permissions ?? [])].join(" ").toLowerCase().includes(normalizedQuery)
        })
    }, [roles, searchQuery, statusFilter])

    if (getApiStatusCode(error) === 403 || getApiStatusCode(permissionCatalogError) === 403) {
        return <Navigate to="/forbidden" replace />
    }

    const closeDrawer = () => {
        setIsDrawerOpen(false)
        setEditingRole(null)
        form.resetFields()
    }

    const openCreate = () => {
        setEditingRole(null)
        form.setFieldsValue({code: "", name: "", isActive: true, permissions: []})
        setIsDrawerOpen(true)
    }

    const openEdit = (role: Role) => {
        setEditingRole(role)
        form.setFieldsValue({
            code: role.code,
            name: role.name,
            isActive: role.isActive,
            permissions: role.permissions ?? []
        })
        setIsDrawerOpen(true)
    }

    const handlePermissionToggle = (permission: PermissionCode) => {
        form.setFieldValue("permissions", togglePermission(selectedPermissions, permission))
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload = {
                code: values.code,
                name: values.name,
                isActive: values.isActive,
                permissions: values.permissions ?? []
            }

            if (editingRole) {
                await updateRole({id: editingRole.id, ...payload}).unwrap()
                message.success("Роль обновлена")
            } else {
                await createRole(payload).unwrap()
                message.success("Роль создана")
            }

            closeDrawer()
        } catch (error) {
            const errorMessage = getNestErrorMessage(error)
            if (errorMessage.includes("Unknown permission code")) {
                refetchPermissionCatalog()
            }
            message.error(errorMessage)
        }
    }

    const handleDelete = async (role: Role) => {
        try {
            await deleteRole(role.id).unwrap()
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
            title: "Доступы",
            dataIndex: "permissions",
            render: (permissions: PermissionCode[]) => summarizePermissions(permissions ?? [], permissionCatalog)
        },
        ...(canManageStaff
            ? [{
                title: "Действия",
                key: "actions",
                width: 220,
                render: (_: unknown, role: Role) => (
                    <Space>
                        <Button onClick={() => openEdit(role)}>Редактировать</Button>
                        <Popconfirm
                            title="Удалить роль?"
                            description="Проверьте, что роль не нужна активным сотрудникам. Для временного запрета безопаснее выключить статус роли."
                            okText="Удалить"
                            cancelText="Отмена"
                            onConfirm={() => handleDelete(role)}
                            okButtonProps={{loading: isDeleting}}
                        >
                            <Button danger>Удалить</Button>
                        </Popconfirm>
                    </Space>
                )
            } satisfies ColumnsType<Role>[number]]
            : [])
    ]

    return (
        <Space orientation="vertical" size={16} style={{width: "100%"}}>
            <PageHeading
                title="Роли"
                subtitle="Управление ролями, статусами и матрицей доступов."
                extra={canManageStaff ? (
                    <Button type="primary" onClick={openCreate}>
                        Создать роль
                    </Button>
                ) : null}
            />

            <Card>
                <Space size={28}>
                    <Statistic title="Всего ролей" value={roles.length} />
                    <Statistic title="Активные" value={roles.filter((role) => role.isActive).length} />
                    <Statistic title="Модулей доступа" value={permissionCatalog?.length ?? 0} loading={isPermissionCatalogLoading} />
                </Space>
            </Card>

            {error && (
                <Alert
                    type="warning"
                    showIcon
                    message="Роли не загрузились полностью"
                    description="Проверьте подключение или права доступа перед изменением матрицы ролей."
                />
            )}

            <Card>
                <Space orientation="vertical" size={16} style={{width: "100%"}}>
                    <Space wrap style={{width: "100%", justifyContent: "space-between"}}>
                        <Segmented
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value as RoleStatusFilter)}
                            options={[
                                {label: `Все (${roles.length})`, value: "all"},
                                {label: `Активные (${roles.filter((role) => role.isActive).length})`, value: "active"},
                                {label: `Неактивные (${roles.filter((role) => !role.isActive).length})`, value: "inactive"},
                                {label: `Без доступов (${roles.filter((role) => !role.permissions.length).length})`, value: "withoutPermissions"}
                            ]}
                        />
                        <Input.Search
                            allowClear
                            placeholder="Поиск по коду, названию или permission"
                            style={{maxWidth: 420}}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            onSearch={setSearchQuery}
                        />
                    </Space>
                    <Typography.Text type="secondary">
                        Показано {filteredRoles.length} из {roles.length}. Фильтр «Без доступов» помогает быстро найти роли, которые не дают сотрудникам рабочих прав.
                    </Typography.Text>
                    <Table<Role>
                        rowKey="id"
                        loading={isLoading || isPermissionCatalogLoading}
                        columns={columns}
                        dataSource={filteredRoles}
                        pagination={false}
                        scroll={{x: 1100}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={searchQuery || statusFilter !== "all"
                                        ? "Роли не найдены — измените поиск или фильтр статуса."
                                        : "Ролей пока нет. Создайте роль и назначьте минимально необходимые доступы."}
                                />
                            )
                        }}
                    />
                </Space>
            </Card>

            <Drawer
                title={editingRole ? "Редактирование роли" : "Создание роли"}
                open={isDrawerOpen}
                onClose={closeDrawer}
                width="min(920px, 100vw)"
                extra={(
                    <Space>
                        <Button onClick={closeDrawer}>Отмена</Button>
                        <Button type="primary" loading={isCreating || isUpdating} onClick={handleSubmit}>
                            Сохранить
                        </Button>
                    </Space>
                )}
            >
                <Form<RoleFormValues> form={form} layout="vertical" initialValues={{isActive: true, permissions: []}}>
                    <Form.Item
                        name="code"
                        label="Код"
                        normalize={(value: string) => value?.toUpperCase()}
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
                        <Input placeholder="Менеджер" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Активна" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="permissions" label="Матрица доступов">
                        <PermissionMatrix
                            catalog={permissionCatalog}
                            selectedPermissions={selectedPermissions}
                            onToggle={handlePermissionToggle}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </Space>
    )
}

export default RolesPage
