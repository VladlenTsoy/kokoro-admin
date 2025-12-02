import {useCallback, useEffect, useMemo, useState} from "react"
import {useLocation, useNavigate} from "react-router-dom"
import type {SelectProductsFilterParams} from "../features/product/ProductType"

const PAGE_CURRENT = 1
const PAGE_SIZE = 30

type UpdateKey = "search" | "pagination" | "categoryIds" | "sizeIds" | "clear"

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
    const sizeIds = safeParseArrayParam(query.get("sizeIds"))
    const current = query.get("current") ? Number(query.get("current")) : PAGE_CURRENT
    const pageSize = query.get("pageSize") ? Number(query.get("pageSize")) : PAGE_SIZE

    return {status, search, categoryIds, sizeIds, current, pageSize, query}
}

export const useGetParams = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // derive initial params from location
    const initial = useMemo(() => {
        const {status, search, categoryIds, sizeIds, current, pageSize} = readParamsFromLocation(
            location.search,
            location.pathname
        )
        const base: SelectProductsFilterParams = {
            type: status,
            search: search ?? "",
            categoryIds,
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
        (key: UpdateKey, val: {current?: number, pageSize?: number} | string | number | undefined) => {
            // read current query from location to avoid overwriting unrelated params
            const {query, categoryIds: currentCategoryIds, sizeIds: currentSizeIds} = readParamsFromLocation(
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
                    // val expected { current?: number; pageSize?: number }
                    if (val?.current != null) query.set("current", String(Number(val.current)))
                    if (val?.pageSize != null) query.set("pageSize", String(Number(val.pageSize)))
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

                case "clear": {
                    query.delete("search")
                    query.delete("categoryIds")
                    query.delete("sizeIds")
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
        const {status, search, categoryIds, sizeIds, current, pageSize} = readParamsFromLocation(
            location.search,
            location.pathname
        )

        setParams({
            type: status,
            search: search || "",
            categoryIds,
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
