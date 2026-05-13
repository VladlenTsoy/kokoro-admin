import {useCallback, useEffect, useMemo, useState} from "react"
import {useLocation, useNavigate} from "react-router-dom"
import type {SelectProductsFilterParams} from "../features/product/ProductType"

const PAGE_CURRENT = 1
const PAGE_SIZE = 30

type UpdateKey =
    | "search"
    | "pagination"
    | "categoryIds"
    | "sizeIds"
    | "collectionIds"
    | "salesPointIds"
    | "storageIds"
    | "sorter"
    | "clear"
type PaginationValue = {current?: number, pageSize?: number}
type SorterValue = {field?: string, order?: "ascend" | "descend"}
type UpdateValue = PaginationValue | SorterValue | string | number | number[] | undefined
type ArrayFilterKey = Extract<UpdateKey, "categoryIds" | "sizeIds" | "collectionIds" | "salesPointIds" | "storageIds">

const ARRAY_FILTER_KEYS: ArrayFilterKey[] = [
    "categoryIds",
    "sizeIds",
    "collectionIds",
    "salesPointIds",
    "storageIds"
]

function safeParseArrayParam(value: string | null): number[] {
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.map((v) => Number(v))
    } catch {
        // fallback: try comma-separated values
        if (typeof value === "string" && value.length) {
            return value.split(",").map((v) => Number(v)).filter(Boolean)
        }
    }
    return []
}

function readParamsFromLocation(locationSearch: string, locationPathname: string) {
    const query = new URLSearchParams(locationSearch)
    const status = locationPathname.replace("/products/", "").replace("/products", "") || "all"
    const search = query.get("search") || ""
    const categoryIds = safeParseArrayParam(query.get("categoryIds"))
    const collectionIds = safeParseArrayParam(query.get("collectionIds"))
    const salesPointIds = safeParseArrayParam(query.get("salesPointIds"))
    const storageIds = safeParseArrayParam(query.get("storageIds"))
    const sizeIds = safeParseArrayParam(query.get("sizeIds"))
    const current = query.get("current") ? Number(query.get("current")) : PAGE_CURRENT
    const pageSize = query.get("pageSize") ? Number(query.get("pageSize")) : PAGE_SIZE
    const sortField = query.get("sortField") || "created_at"
    const sortOrder = query.get("sortOrder") === "ascend" ? "ascend" : "descend"

    return {status, search, categoryIds, collectionIds, salesPointIds, storageIds, sizeIds, current, pageSize, sortField, sortOrder, query}
}

function isArrayFilterKey(key: UpdateKey): key is ArrayFilterKey {
    return ARRAY_FILTER_KEYS.includes(key as ArrayFilterKey)
}

function normalizeArrayValue(value: UpdateValue, currentValue: number[]) {
    if (Array.isArray(value)) return value.map(Number)
    if (value == null) return []

    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return currentValue

    return currentValue.includes(numericValue)
        ? currentValue.filter((item) => item !== numericValue)
        : [...currentValue, numericValue]
}

function setArrayQueryParam(query: URLSearchParams, key: ArrayFilterKey, value: number[]) {
    if (value.length === 0) {
        query.delete(key)
        return
    }

    query.set(key, JSON.stringify(value))
}

export const useGetParams = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // derive initial params from location
    const initial = useMemo(() => {
        const {status, search, categoryIds, collectionIds, salesPointIds, storageIds, sizeIds, current, pageSize, sortField, sortOrder} = readParamsFromLocation(
            location.search,
            location.pathname
        )
        const base: SelectProductsFilterParams = {
            type: status,
            search: search ?? "",
            categoryIds,
            collectionIds,
            salesPointIds,
            storageIds,
            sizeIds,
            sorter: {field: sortField, order: sortOrder as "ascend" | "descend"},
            pagination: {current, pageSize}
        }
        return base
    }, [location.search, location.pathname])

    const [params, setParams] = useState<SelectProductsFilterParams>(initial)

    // update query and navigate
    const updateParams = useCallback(
        (key: UpdateKey, val: UpdateValue) => {
            // read current query from location to avoid overwriting unrelated params
            const {
                query,
                categoryIds: currentCategoryIds,
                sizeIds: currentSizeIds,
                collectionIds: currentCollectionIds,
                salesPointIds: currentSalesPointIds,
                storageIds: currentStorageIds
            } = readParamsFromLocation(
                location.search,
                location.pathname
            )

            let targetPathname = location.pathname

            if (isArrayFilterKey(key)) {
                const currentValuesByKey: Record<ArrayFilterKey, number[]> = {
                    categoryIds: currentCategoryIds,
                    sizeIds: currentSizeIds,
                    collectionIds: currentCollectionIds,
                    salesPointIds: currentSalesPointIds,
                    storageIds: currentStorageIds
                }
                const nextValues = normalizeArrayValue(val, currentValuesByKey[key])

                setArrayQueryParam(query, key, nextValues)
                query.set("current", String(1))
            } else switch (key) {
                case "search": {
                    if (val == null || String(val).trim() === "") {
                        query.delete("search")
                    } else {
                        query.set("search", String(val))
                    }
                    // reset pagination to first page on new search
                    query.set("current", String(1))
                    break
                }

                case "sorter": {
                    const sorter = typeof val === "object" && val !== null && !Array.isArray(val)
                        ? val as SorterValue
                        : undefined
                    if (sorter?.field && sorter?.order) {
                        query.set("sortField", sorter.field)
                        query.set("sortOrder", sorter.order)
                    } else {
                        query.delete("sortField")
                        query.delete("sortOrder")
                    }
                    query.set("current", String(1))
                    break
                }

                case "pagination": {
                    const pagination = typeof val === "object" && val !== null && !Array.isArray(val)
                        ? val as PaginationValue
                        : undefined
                    if (pagination?.current != null) query.set("current", String(Number(pagination.current)))
                    if (pagination?.pageSize != null) query.set("pageSize", String(Number(pagination.pageSize)))
                    break
                }

                case "clear": {
                    query.delete("search")
                    query.delete("categoryIds")
                    query.delete("sizeIds")
                    query.delete("collectionIds")
                    query.delete("salesPointIds")
                    query.delete("storageIds")
                    query.delete("sortField")
                    query.delete("sortOrder")
                    query.set("current", String(1))
                    targetPathname = "/products/all"
                    break
                }
            }

            const searchString = query.toString()
            const to = `${targetPathname}${searchString ? `?${searchString}` : ""}`
            // navigate without reloading, pushing new entry to history
            navigate(to, {replace: false})
        },
        [location.pathname, location.search, navigate]
    )

    // Sync local `params` state when location changes
    useEffect(() => {
        const {
            status,
            search,
            categoryIds,
            collectionIds,
            salesPointIds,
            storageIds,
            sizeIds,
            current,
            pageSize,
            sortField,
            sortOrder
        } = readParamsFromLocation(
            location.search,
            location.pathname
        )

        setParams({
            type: status,
            search: search || "",
            categoryIds,
            collectionIds,
            salesPointIds,
            storageIds,
            sizeIds,
            sorter: {field: sortField, order: sortOrder as "ascend" | "descend"},
            pagination: {
                current: current || PAGE_CURRENT,
                pageSize: pageSize || PAGE_SIZE
            }
        })
    }, [location.pathname, location.search])

    return {params, updateParams}
}
