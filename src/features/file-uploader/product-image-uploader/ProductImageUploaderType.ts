export interface ProductTemporaryImageType {
    tmp_id: number;
    id?: number;
    name?: string;
    path?: string;
    url: string;
    size?: number;
    position?: number;
    loading?: boolean;
    error?: boolean;
    to_delete?: boolean;
}