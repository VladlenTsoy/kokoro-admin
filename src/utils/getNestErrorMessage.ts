import type {NestApiError} from "../features/auth/authTypes.ts"

export const getNestErrorMessage = (error: unknown): string => {
    if (!error) {
        return "Произошла ошибка"
    }

    if (typeof error === "object" && error !== null && "data" in error) {
        const withData = error as {data?: unknown}
        const payload = withData.data as NestApiError | undefined

        if (Array.isArray(payload?.message)) {
            return payload.message.join("\n")
        }

        if (typeof payload?.message === "string") {
            return payload.message
        }

        if (typeof payload?.error === "string") {
            return payload.error
        }
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        const withMessage = error as {message?: unknown}

        if (typeof withMessage.message === "string") {
            return withMessage.message
        }
    }

    if (typeof error === "string") {
        return error
    }

    return "Произошла ошибка"
}
