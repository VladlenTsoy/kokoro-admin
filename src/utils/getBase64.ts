export const getBase64 = (
    img: Blob,
    callback: (imageUrl: string | null) => void
) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
        callback(typeof reader.result === "string" ? reader.result : null)
    })
    reader.readAsDataURL(img)
}
