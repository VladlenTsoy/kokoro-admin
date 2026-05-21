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
import {isAntdFormValidationError} from "../../utils/isAntdFormValidationError.ts"
import PageHeading from "../../components/PageHeading.tsx"

interface RoleFormValues {
    code: string
    name: string
    isActive: boolean
    permissions: PermissionCode[]
}

const ACTIONS: PermissionAction[] = ["read", "create", "update", "delete", "manage"]
type RoleStatusFilter = "all" | "active" | "inactive"
const ACTION_LABELS: Record<PermissionAction, string> = {
    read: "Просмотр",
    create: "Создание",
    update: "Изменение",
    delete: "Удаление",
    manage: "Полный доступ"
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

            return `${module.title}: ${moduleActions.map((action) => ACTION_LABELS[action].toLowerCase()).join(", ")}`
        })
        .filter(Boolean)
        .join("; ") || "—"
}

interface PermissionMatrixProps {
    catalog?: PermissionCatalogModule[]
    selectedPermissions: PermissionCode[]
    onToggle: (permission: PermissionCode) => void
    disabled?: boolean
}

const PermissionMatrix = ({catalog, selectedPermissions, onToggle, disabled = false}: PermissionMatrixProps) => {
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
                                disabled={disabled || (action !== "manage" && isManageSelected)}
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
    const {data, isLoading, isFetching, error, refetch: refetchRoles} = useGetRolesQuery()
    const {
        data: permissionCatalog,
        isLoading: isPermissionCatalogLoading,
        isFetching: isPermissionCatalogFetching,
        error: permissionCatalogError,
        refetch: refetchPermissionCatalog
    } = useGetRolePermissionsQuery()
    const [createRole, {isLoading: isCreating}] = useCreateRoleMutation()
    const [updateRole, {isLoading: isUpdating}] = useUpdateRoleMutation()
    const [deleteRole] = useDeleteRoleMutation()

    const canManageStaff = useCan("staff.manage")
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)
    const [roleSearch, setRoleSearch] = useState("")
    const [roleStatusFilter, setRoleStatusFilter] = useState<RoleStatusFilter>("all")
    const [form] = Form.useForm<RoleFormValues>()
    const isSavingRole = isCreating || isUpdating
    const isRoleListConfirmed = Boolean(data) && !isLoading && !isFetching && !error
    const isPermissionCatalogConfirmed = Boolean(permissionCatalog) && !isPermissionCatalogLoading && !isPermissionCatalogFetching && !permissionCatalogError
    const canMutateRoles = canManageStaff && isRoleListConfirmed && isPermissionCatalogConfirmed
    const isRoleMutationInFlight = isSavingRole || Boolean(deletingRoleId)
    const roleCreateDisabledReason = !canManageStaff
        ? "Создавать роли может только сотрудник с правом staff.manage."
        : !isRoleListConfirmed || !isPermissionCatalogConfirmed
            ? "Дождитесь подтверждённой загрузки ролей и матрицы permissions перед созданием первой роли."
            : isRoleMutationInFlight
                ? "Дождитесь завершения текущего сохранения или удаления роли."
                : null
    const selectedPermissions = Form.useWatch("permissions", form) ?? []
    const selectedManagePermissions = selectedPermissions.filter((permission) => permission.endsWith(".manage"))
    const selectedDeletePermissions = selectedPermissions.filter((permission) => permission.endsWith(".delete"))
    const selectedPermissionRiskCount = selectedManagePermissions.length + selectedDeletePermissions.length

    const roles = useMemo(() => (data ? [...data].sort((a, b) => b.id - a.id) : []), [data])
    const normalizedRoleSearch = roleSearch.trim().toLowerCase()
    const filteredRoles = useMemo(() => roles.filter((role) => {
        const matchesStatus = roleStatusFilter === "all"
            || (roleStatusFilter === "active" && role.isActive)
            || (roleStatusFilter === "inactive" && !role.isActive)
        const matchesSearch = !normalizedRoleSearch
            || role.code.toLowerCase().includes(normalizedRoleSearch)
            || role.name.toLowerCase().includes(normalizedRoleSearch)

        return matchesStatus && matchesSearch
    }), [normalizedRoleSearch, roleStatusFilter, roles])
    const hasRoleFilters = Boolean(normalizedRoleSearch) || roleStatusFilter !== "all"

    if (getApiStatusCode(error) === 403 || getApiStatusCode(permissionCatalogError) === 403) {
        return <Navigate to="/forbidden" replace />
    }

    const closeDrawer = () => {
        if (isSavingRole) {
            return
        }

        setIsDrawerOpen(false)
        setEditingRole(null)
        form.resetFields()
    }

    const openCreate = () => {
        if (!canMutateRoles || isRoleMutationInFlight) {
            return
        }

        setEditingRole(null)
        form.setFieldsValue({code: "", name: "", isActive: true, permissions: []})
        setIsDrawerOpen(true)
    }

    const openEdit = (role: Role) => {
        if (!canMutateRoles || isRoleMutationInFlight) {
            return
        }

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
            if (isAntdFormValidationError(error)) {
                return
            }

            const errorMessage = getNestErrorMessage(error)
            if (errorMessage.includes("Unknown permission code")) {
                refetchPermissionCatalog()
            }
            message.error(errorMessage)
        }
    }

    const handleDelete = async (role: Role) => {
        if (!canMutateRoles || isRoleMutationInFlight) {
            return
        }

        setDeletingRoleId(role.id)

        try {
            await deleteRole(role.id).unwrap()
            message.success("Роль удалена")
        } catch (error) {
            message.error(getNestErrorMessage(error))
        } finally {
            setDeletingRoleId(null)
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
                render: (_: unknown, role: Role) => {
                    const isCurrentRoleDeleting = deletingRoleId === role.id
                    const isAnotherRoleDeleting = Boolean(deletingRoleId && !isCurrentRoleDeleting)
                    const areRoleActionsDisabled = !canMutateRoles || isSavingRole || isCurrentRoleDeleting || isAnotherRoleDeleting
                    const roleStatusLabel = role.isActive ? "активна" : "отключена"
                    const permissionsCount = role.permissions?.length ?? 0
                    const roleActionContext = `роль ${role.name} (${role.code}), ${roleStatusLabel}, доступов: ${permissionsCount}`
                    const editRoleLabel = `Редактировать ${roleActionContext}`
                    const deleteRoleLabel = `Удалить ${roleActionContext}`
                    const mutationBlockedReason = !canMutateRoles
                        ? "Дождитесь подтверждённой загрузки ролей и матрицы permissions перед изменением доступа."
                        : isSavingRole
                            ? "Дождитесь завершения сохранения роли."
                            : isAnotherRoleDeleting
                                ? "Дождитесь завершения удаления другой роли."
                                : undefined

                    return (
                        <Space>
                            <Button
                                disabled={areRoleActionsDisabled}
                                onClick={() => openEdit(role)}
                                aria-label={editRoleLabel}
                                title={mutationBlockedReason || editRoleLabel}
                            >
                                Редактировать
                            </Button>
                            <Popconfirm
                                title={`Удалить роль ${role.name}?`}
                                description="Удаление может сломать доступ сотрудников, если роль уже используется. Для временного ограничения безопаснее отключить роль."
                                okText="Удалить"
                                cancelText="Отмена"
                                onConfirm={() => handleDelete(role)}
                                okButtonProps={{loading: isCurrentRoleDeleting}}
                            >
                                <Button
                                    danger
                                    loading={isCurrentRoleDeleting}
                                    disabled={!canMutateRoles || isSavingRole || isAnotherRoleDeleting}
                                    aria-label={deleteRoleLabel}
                                    title={mutationBlockedReason || deleteRoleLabel}
                                >
                                    Удалить
                                </Button>
                            </Popconfirm>
                        </Space>
                    )
                }
            } satisfies ColumnsType<Role>[number]]
            : [])
    ]

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <PageHeading
                title="Роли"
                subtitle="Управление ролями, статусами и матрицей доступов."
                extra={canManageStaff ? (
                    <Button type="primary" disabled={!canMutateRoles || isRoleMutationInFlight} onClick={openCreate}>
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

            <Card>
                <Space direction="vertical" size={16} style={{width: "100%"}}>
                    {error ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось загрузить роли"
                            description="Проверьте доступ к админке или повторите загрузку, прежде чем менять права сотрудников."
                            action={<Button onClick={() => refetchRoles()}>Повторить</Button>}
                        />
                    ) : null}
                    {permissionCatalogError ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Матрица доступов недоступна"
                            description="Без каталога permissions менеджер может видеть только коды доступов. Изменения ролей лучше отложить до восстановления справочника."
                            action={<Button onClick={() => refetchPermissionCatalog()}>Повторить</Button>}
                        />
                    ) : null}
                    {canManageStaff && !canMutateRoles ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Изменение ролей временно заблокировано"
                            description="Дождитесь подтверждённой загрузки списка ролей и матрицы permissions или повторите загрузку. Это защищает staff-доступы от правок по устаревшей таблице."
                            action={(
                                <Space wrap>
                                    <Button onClick={() => refetchRoles()}>Обновить роли</Button>
                                    <Button onClick={() => refetchPermissionCatalog()}>Обновить permissions</Button>
                                </Space>
                            )}
                        />
                    ) : null}
                    <Alert
                        type="info"
                        showIcon
                        message="Роли влияют на доступ сотрудников к операционным разделам"
                        description="Перед удалением или отключением роли проверьте, какие сотрудники используют её в смене. Если роль нужна для истории или временно не используется — лучше отключить её, а не удалять."
                    />
                    <Space wrap style={{width: "100%", justifyContent: "space-between"}}>
                        <Space wrap>
                            <Input.Search
                                allowClear
                                placeholder="Найти роль по коду или названию"
                                value={roleSearch}
                                onChange={(event) => setRoleSearch(event.target.value)}
                                style={{width: 320, maxWidth: "100%"}}
                            />
                            <Segmented<RoleStatusFilter>
                                value={roleStatusFilter}
                                onChange={setRoleStatusFilter}
                                options={[
                                    {label: "Все", value: "all"},
                                    {label: "Активные", value: "active"},
                                    {label: "Отключённые", value: "inactive"}
                                ]}
                            />
                        </Space>
                        <Typography.Text type="secondary">
                            Показано {filteredRoles.length} из {roles.length}
                        </Typography.Text>
                    </Space>
                    {hasRoleFilters ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Применены фильтры ролей"
                            description="Если нужной роли нет в списке, сбросьте поиск и статус перед созданием новой — так меньше риск завести дубль доступа."
                            action={<Button onClick={() => { setRoleSearch(""); setRoleStatusFilter("all") }}>Сбросить</Button>}
                        />
                    ) : null}
                    <Table<Role>
                        rowKey="id"
                        loading={isLoading || isFetching || isPermissionCatalogLoading || isPermissionCatalogFetching}
                        columns={columns}
                        dataSource={filteredRoles}
                        pagination={false}
                        scroll={{x: 1100}}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={hasRoleFilters
                                        ? "По выбранным фильтрам роли не найдены. Сбросьте поиск и статус перед созданием новой роли, чтобы избежать дублей."
                                        : "Роли ещё не настроены. Создайте первую роль и выдайте только необходимые доступы для работы смены."}
                                >
                                    {hasRoleFilters ? (
                                        <Button onClick={() => { setRoleSearch(""); setRoleStatusFilter("all") }}>Сбросить фильтры</Button>
                                    ) : canManageStaff ? (
                                        <Space direction="vertical" size={8} align="center">
                                            <Button
                                                type="primary"
                                                disabled={Boolean(roleCreateDisabledReason)}
                                                onClick={openCreate}
                                            >
                                                Создать первую роль
                                            </Button>
                                            {roleCreateDisabledReason ? (
                                                <Typography.Text type="secondary">
                                                    {roleCreateDisabledReason}
                                                </Typography.Text>
                                            ) : null}
                                        </Space>
                                    ) : null}
                                </Empty>
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
                maskClosable={!isSavingRole}
                keyboard={!isSavingRole}
                closable={!isSavingRole}
                extra={(
                    <Space>
                        <Button disabled={isSavingRole} onClick={closeDrawer}>Отмена</Button>
                        <Button type="primary" loading={isSavingRole} onClick={handleSubmit}>
                            {isSavingRole ? "Сохраняем…" : "Сохранить"}
                        </Button>
                    </Space>
                )}
            >
                <Form<RoleFormValues> form={form} layout="vertical" disabled={isSavingRole} initialValues={{isActive: true, permissions: []}}>
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
                    <Form.Item
                        name="isActive"
                        label="Активна"
                        valuePropName="checked"
                        extra="Отключённая роль остаётся в системе, но не должна использоваться для новых назначений. Это безопаснее удаления, если роль уже была у сотрудников."
                    >
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                    <Alert
                        type="warning"
                        showIcon
                        style={{marginBottom: 16}}
                        message="Выдавайте минимально необходимый доступ"
                        description="Полный доступ в модуле автоматически покрывает просмотр, создание, изменение и удаление. Проверяйте delete/manage права отдельно перед сохранением роли."
                    />
                    {isSavingRole ? (
                        <Alert
                            type="info"
                            showIcon
                            style={{marginBottom: 16}}
                            message="Сохраняем роль"
                            description="Поля и матрица доступов временно заблокированы, чтобы не отправить смешанные права или повторный запрос. Дождитесь ответа API."
                        />
                    ) : null}
                    <Alert
                        type={selectedPermissionRiskCount ? "warning" : "info"}
                        showIcon
                        style={{marginBottom: 16}}
                        message={selectedPermissionRiskCount
                            ? `В роли выбрано рискованных прав: ${selectedPermissionRiskCount}`
                            : "В роли пока нет delete/manage прав"}
                        description={selectedPermissionRiskCount
                            ? "Перед сохранением проверьте, что эти права действительно нужны сотруднику в смене: они могут менять критичные настройки, заказы, каталог или доступы."
                            : "Это хороший базовый уровень для роли просмотра/оператора. Добавляйте удаление или полный доступ только под конкретный рабочий сценарий."}
                    />
                    <Form.Item name="permissions" label="Матрица доступов">
                        <PermissionMatrix
                            catalog={permissionCatalog}
                            selectedPermissions={selectedPermissions}
                            onToggle={handlePermissionToggle}
                            disabled={isSavingRole}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </Space>
    )
}

export default RolesPage
