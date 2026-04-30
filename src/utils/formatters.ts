export function formatMoney(value?: number | null) {
    if (value == null) {
        return "—"
    }

    return `${value.toLocaleString("ru-RU")} сум`
}
