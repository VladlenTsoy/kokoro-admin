import type {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import type {SerializedError} from "@reduxjs/toolkit"

export const getApiStatusCode = (error: FetchBaseQueryError | SerializedError | undefined): number | null => {
    if (!error) {
        return null
    }

    if ("status" in error && typeof error.status === "number") {
        return error.status
    }

    return null
}
