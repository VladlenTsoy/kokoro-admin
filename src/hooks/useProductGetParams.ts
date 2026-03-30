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
    | "clear"
type PaginationValue = {current?: number, pageSize?: number}
type UpdateValue = PaginationValue | string | number | number[] | undefined

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

    return {status, search, categoryIds, collectionIds, salesPointIds, storageIds, sizeIds, current, pageSize, query}
}

export const useGetParams = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // derive initial params from location
    const initial = useMemo(() => {
        const {status, search, categoryIds, collectionIds, salesPointIds, storageIds, sizeIds, current, pageSize} = readParamsFromLocation(
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
            sorter: {field: "created_at", order: "descend"},
            pagination: {current, pageSize}
        }
        return base
    }, [location.search, location.pathname])

    const [params, setParams] = useState<SelectProductsFilterParams>(initial)

    // utility: toggle value in array (returns new array)
    const toggleInArray = useCallback((arr: number[], val: number) => {
        const exists = arr.includes(val)
        return exists ? arr.filter((v) => v !== val) : [...arr, val]
    }, [])

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

            switch (key) {
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

                case "pagination": {
                    const pagination = typeof val === "object" && val !== null && !Array.isArray(val)
                        ? val as PaginationValue
                        : undefined
                    if (pagination?.current != null) query.set("current", String(Number(pagination.current)))
                    if (pagination?.pageSize != null) query.set("pageSize", String(Number(pagination.pageSize)))
                    break
                }

                case "categoryIds": {
                    // val is the id to toggle (number) or an array to replace
                    let next: number[] = []
                    if (Array.isArray(val)) next = val.map(Number)
                    else if (val == null) next = []
                    else next = toggleInArray(currentCategoryIds, Number(val))
                    if (next.length === 0) query.delete("categoryIds")
                    else query.set("categoryIds", JSON.stringify(next))
                    // reset page on filter change
                    query.set("current", String(1))
                    break
                }

                case "sizeIds": {
                    let next: number[] = []
                    if (Array.isArray(val)) next = val.map(Number)
                    else if (val == null) next = []
                    else next = toggleInArray(currentSizeIds, Number(val))
                    if (next.length === 0) query.delete("sizeIds")
                    else query.set("sizeIds", JSON.stringify(next))
                    query.set("current", String(1))
                    break
                }

                case "collectionIds": {
                    let next: number[] = []
                    if (Array.isArray(val)) next = val.map(Number)
                    else if (val == null) next = []
                    else next = toggleInArray(currentCollectionIds, Number(val))
                    if (next.length === 0) query.delete("collectionIds")
                    else query.set("collectionIds", JSON.stringify(next))
                    query.set("current", String(1))
                    break
                }

                case "salesPointIds": {
                    let next: number[] = []
                    if (Array.isArray(val)) next = val.map(Number)
                    else if (val == null) next = []
                    else next = toggleInArray(currentSalesPointIds, Number(val))
                    if (next.length === 0) query.delete("salesPointIds")
                    else query.set("salesPointIds", JSON.stringify(next))
                    query.set("current", String(1))
                    break
                }

                case "storageIds": {
                    let next: number[] = []
                    if (Array.isArray(val)) next = val.map(Number)
                    else if (val == null) next = []
                    else next = toggleInArray(currentStorageIds, Number(val))
                    if (next.length === 0) query.delete("storageIds")
                    else query.set("storageIds", JSON.stringify(next))
                    query.set("current", String(1))
                    break
                }

                case "clear": {
                    query.delete("search")
                    query.delete("categoryIds")
                    query.delete("sizeIds")
                    query.delete("collectionIds")
                    query.delete("salesPointIds")
                    query.delete("storageIds")
                    query.set("current", String(1))
                    break
                }
            }

            const searchString = query.toString()
            const to = `${location.pathname}${searchString ? `?${searchString}` : ""}`
            // navigate without reloading, pushing new entry to history
            navigate(to, {replace: false})
        },
        [location.pathname, location.search, navigate, toggleInArray]
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
            pageSize
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
            sorter: {field: "created_at", order: "descend"},
            pagination: {
                current: current || PAGE_CURRENT,
                pageSize: pageSize || PAGE_SIZE
            }
        })
    }, [location.pathname, location.search])

    return {params, updateParams}
}
