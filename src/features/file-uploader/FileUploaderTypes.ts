export interface FileTypes {
    size: number
    key: string
    name: string
    location: string
}

export interface DeleteFileArgs {
    path: string
}

export interface DeleteFileResponse {
    status: number
    code: string
}