import { describe, expect, it, vi } from "vitest"
import { fetchAllPages, type PageData } from "./pagination"

interface Row {
    code: string
}

const rows = (from: number, to: number): Row[] =>
    Array.from({ length: to - from }, (_, i) => ({ code: `R${from + i}` }))

const keyOf = (row: Row) => row.code

describe("fetchAllPages", () => {
    it("keeps going when the server caps the page size below the one requested", async () => {
        // We ask for 100 but the server only ever returns 20 per page.
        const fetchPage = vi.fn(async (page: number): Promise<PageData<Row>> => ({
            content: rows(page * 20, Math.min(page * 20 + 20, 50)),
            totalPages: 3,
        }))

        const result = await fetchAllPages(fetchPage, keyOf, 100)

        expect(result).toHaveLength(50)
        expect(fetchPage).toHaveBeenCalledTimes(3)
    })

    it("stops at the page flagged as last", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<PageData<Row>> => ({
            content: rows(page * 10, page * 10 + 10),
            last: page === 1,
        }))

        expect(await fetchAllPages(fetchPage, keyOf)).toHaveLength(20)
        expect(fetchPage).toHaveBeenCalledTimes(2)
    })

    it("uses totalElements when there is no totalPages or last flag", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<PageData<Row>> => ({
            content: rows(page * 10, page * 10 + 10),
            totalElements: 25,
        }))

        // The third page would be a repeat-free continuation; stop once 25 are loaded.
        const result = await fetchAllPages(fetchPage, keyOf)

        expect(result.length).toBeGreaterThanOrEqual(25)
        expect(fetchPage).toHaveBeenCalledTimes(3)
    })

    it("does not loop forever when the server ignores the page number", async () => {
        const fetchPage = vi.fn(async (): Promise<PageData<Row>> => rows(0, 100))

        const result = await fetchAllPages(fetchPage, keyOf, 100)

        expect(result).toHaveLength(100)
        expect(fetchPage).toHaveBeenCalledTimes(2)
    })

    it("treats a bare array shorter than the page size as the only page", async () => {
        const fetchPage = vi.fn(async (): Promise<PageData<Row>> => rows(0, 7))

        expect(await fetchAllPages(fetchPage, keyOf, 100)).toHaveLength(7)
        expect(fetchPage).toHaveBeenCalledTimes(1)
    })

    it("returns nothing for an empty list", async () => {
        expect(await fetchAllPages(async () => ({ content: [] }), keyOf)).toEqual([])
    })
})
