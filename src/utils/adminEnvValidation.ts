export type AdminEnvName = "VITE_API_ADMIN_URL" | "VITE_CDN_URL"

export interface AdminEnvIssue {
    name: AdminEnvName
    reason: string
}

export interface AdminEnvValidationResult {
    isValid: boolean
    issues: AdminEnvIssue[]
    values: {
        adminApiBaseUrl: string
        publicApiBaseUrl: string
        cdnUrl: string
    }
}

type AdminEnvInput = Record<AdminEnvName, string | undefined>

const EMPTY_VALUES = {
    adminApiBaseUrl: "",
    publicApiBaseUrl: "",
    cdnUrl: ""
}

const parseHttpUrl = (value: string | undefined) => {
    const trimmedValue = value?.trim()

    if (!trimmedValue) {
        return {url: null, reason: "переменная не задана"}
    }

    try {
        const url = new URL(trimmedValue)
        const isHttpUrl = url.protocol === "http:" || url.protocol === "https:"

        if (!isHttpUrl) {
            return {url: null, reason: "должен быть абсолютный HTTP(S) URL"}
        }

        return {url, reason: null}
    } catch {
        return {url: null, reason: "должен быть корректный абсолютный URL"}
    }
}

const normalizeUrl = (url: URL) => url.href.replace(/\/$/, "")

const getPublicApiBaseUrl = (adminApiBaseUrl: string) => adminApiBaseUrl.replace(/\/admin\/?$/, "")

export const validateAdminEnvironment = (env: AdminEnvInput): AdminEnvValidationResult => {
    const issues: AdminEnvIssue[] = []
    const adminApiUrl = parseHttpUrl(env.VITE_API_ADMIN_URL)
    const cdnUrl = parseHttpUrl(env.VITE_CDN_URL)

    if (adminApiUrl.reason) {
        issues.push({name: "VITE_API_ADMIN_URL", reason: adminApiUrl.reason})
    }

    if (cdnUrl.reason) {
        issues.push({name: "VITE_CDN_URL", reason: cdnUrl.reason})
    }

    const adminApiBaseUrl = adminApiUrl.url ? normalizeUrl(adminApiUrl.url) : ""
    const cdnBaseUrl = cdnUrl.url ? normalizeUrl(cdnUrl.url) : ""

    if (adminApiBaseUrl && !/\/admin\/?$/.test(adminApiBaseUrl)) {
        issues.push({
            name: "VITE_API_ADMIN_URL",
            reason: "должен указывать на admin API и заканчиваться на /admin"
        })
    }

    if (issues.length > 0) {
        return {
            isValid: false,
            issues,
            values: EMPTY_VALUES
        }
    }

    return {
        isValid: true,
        issues,
        values: {
            adminApiBaseUrl,
            publicApiBaseUrl: getPublicApiBaseUrl(adminApiBaseUrl),
            cdnUrl: cdnBaseUrl
        }
    }
}

export const adminEnvValidation = validateAdminEnvironment({
    VITE_API_ADMIN_URL: import.meta.env.VITE_API_ADMIN_URL,
    VITE_CDN_URL: import.meta.env.VITE_CDN_URL
})
