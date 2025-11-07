import type {ProductStorageType} from "../product-storage/productStorageTypes.ts"

export interface GeoLocationType {
    lat: number
    lng: number
}

export interface SalesPointType {
    id: number
    title: string
    location: GeoLocationType
    deleted_at?: string | null
}

export interface SalesPointWithStoragesType {
    id: number
    title: string
    location: GeoLocationType
    deleted_at?: string | null
    product_storages: ProductStorageType[]
}
