import type {OrderDeliveryStatus, OrderPaymentStatus} from "../features/orders/OrderTypes.ts"

export type AdminStatusMeta = {
    label: string
    color?: string
}

export const paymentStatusMeta: Record<OrderPaymentStatus, AdminStatusMeta> = {
    pending: {label: "Ждёт оплату", color: "gold"},
    paid: {label: "Оплачен", color: "green"},
    failed: {label: "Ошибка оплаты", color: "red"},
    refunded: {label: "Возврат", color: "purple"}
}

export const deliveryStatusMeta: Record<OrderDeliveryStatus, AdminStatusMeta> = {
    pending: {label: "Новый", color: "orange"},
    preparing: {label: "Собирается", color: "blue"},
    ready: {label: "Готов к выдаче", color: "cyan"},
    delivering: {label: "В доставке", color: "geekblue"},
    delivered: {label: "Доставлен/выдан", color: "green"},
    cancelled: {label: "Отменён", color: "red"}
}

export const bonusOperationMeta: Record<string, AdminStatusMeta> = {
    accrual: {label: "Начисление", color: "green"},
    charge: {label: "Списание", color: "orange"},
    refund: {label: "Возврат", color: "blue"},
    correction: {label: "Коррекция", color: "purple"},
    expiration: {label: "Сгорание", color: "red"}
}

const genericStatusMeta: Record<string, AdminStatusMeta> = {
    ...paymentStatusMeta,
    ...deliveryStatusMeta,
    pending: {label: "Новый / ждёт", color: "orange"},
    preparing: {label: "В работе", color: "blue"},
    ready: {label: "Готов к выдаче", color: "cyan"},
    failed: {label: "Оплата не прошла", color: "red"}
}

export const getPaymentStatusMeta = (value?: string): AdminStatusMeta | undefined => {
    if (!value) return undefined
    return paymentStatusMeta[value as OrderPaymentStatus] || {label: value, color: "default"}
}

export const getDeliveryStatusMeta = (value?: string): AdminStatusMeta | undefined => {
    if (!value) return undefined
    return deliveryStatusMeta[value as OrderDeliveryStatus] || {label: value, color: "default"}
}

export const getBonusOperationMeta = (value?: string): AdminStatusMeta | undefined => {
    if (!value) return undefined
    return bonusOperationMeta[value] || {label: value, color: "default"}
}

export const getGenericStatusMeta = (value?: string): AdminStatusMeta | undefined => {
    if (!value) return undefined
    return genericStatusMeta[value] || {label: value, color: undefined}
}
