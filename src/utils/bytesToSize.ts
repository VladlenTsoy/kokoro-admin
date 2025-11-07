export const bytesToSize = (bytes: number) => {
    const sizes = ["байт", "кб", "мб", "гб", "тб"]
    if (bytes === 0) return "0 Byte"
    const i = Number(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i]
}