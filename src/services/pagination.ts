// A list endpoint returns either a bare array or a Spring-style page object.
export type PageData<T> =
    | T[]
    | { content: T[]; totalPages?: number; totalElements?: number; last?: boolean }

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGES = 100

// Loads every page of a paginated endpoint.
// The server may cap the page size below what we ask for, so a short page does NOT mean the
// last page; only the page metadata (or an empty/repeated page) ends the loop.
export async function fetchAllPages<T>(
    fetchPage: (page: number, size: number) => Promise<PageData<T>>,
    keyOf: (item: T) => string,
    pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
    const byKey = new Map<string, T>()

    for (let page = 0; page < MAX_PAGES; page++) {
        const data = await fetchPage(page, pageSize)
        const rows = Array.isArray(data) ? data : (data?.content ?? [])
        const info = Array.isArray(data) ? undefined : data

        const sizeBefore = byKey.size
        for (const row of rows) byKey.set(keyOf(row), row)

        const isLastPage =
            rows.length === 0 ||
            byKey.size === sizeBefore || // nothing new: the server ignored the page number
            (info?.last !== undefined
                ? info.last
                : info?.totalPages !== undefined
                  ? page + 1 >= info.totalPages
                  : info?.totalElements !== undefined
                    ? byKey.size >= info.totalElements
                    : rows.length < pageSize)

        if (isLastPage) break
    }

    return [...byKey.values()]
}
