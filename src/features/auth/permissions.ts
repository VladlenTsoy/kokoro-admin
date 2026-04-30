import {useSelector} from "react-redux"
import type {StoreState} from "../store.ts"
import type {PermissionCode} from "./authTypes.ts"

export function can(permissions: readonly string[] | undefined, permission: string) {
    const [module] = permission.split(".")

    return Boolean(
        module &&
        (
            permissions?.includes(permission) ||
            permissions?.includes(`${module}.manage`)
        )
    )
}

export function canAny(permissions: readonly string[] | undefined, requiredPermissions: readonly string[]) {
    return requiredPermissions.some((permission) => can(permissions, permission))
}

export const useCan = (permission: PermissionCode) => {
    return useSelector((state: StoreState) => can(state.auth.employee?.permissions, permission))
}

export const useCanAny = (requiredPermissions: PermissionCode[]) => {
    return useSelector((state: StoreState) => canAny(state.auth.employee?.permissions, requiredPermissions))
}
