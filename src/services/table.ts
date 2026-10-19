import { http, type ApiResponse } from "./http"

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"

export type TableType = "POOL" | "CAROM" | "LIBRE"

export interface CreateTableRequest {
    tableType: TableType
    tableStatus: TableStatus
    pricePerHour: number
}

export interface Table {
    tableCode: string
    tableType: string
    tableStatus: TableStatus
    pricePerHour: number
}

export async function getAllTables(): Promise<Table[]> {
    const res = await http.get<ApiResponse<Table[]>> (
        "/table/all"
    )

    return res.data.data
}

export async function createTable(request: CreateTableRequest): Promise<void> {
    await http.post<ApiResponse<unknown>>("/table/create", request)
}

export async function updateTablePrice(
    tableCode: string,
    newPricePerHour: number
): Promise<void> {
    await http.put<ApiResponse<unknown>>("/table/update-price", null, {
        params: { tableCode, newPricePerHour },
    })
}

// "TBL0007" -> "Table 7"; falls back to the raw code if it doesn't match.
export function formatTableCode(code: string, label = "Table"): string {
    const match = /^TBL0*(\d+)$/i.exec(code)
    return match ? `${label} ${match[1]}` : code
}

export async function deleteTable(tableCode: string): Promise<void> {
    await http.delete<ApiResponse<unknown>>(`/table/${encodeURIComponent(tableCode)}`)
}

// Starting and ending a session changes the status by itself, so this is mainly for
// maintenance. The server rejects setting the same status, MAINTENANCE -> OCCUPIED and
// OCCUPIED -> MAINTENANCE.
export async function setTableStatus(
    tableCode: string,
    newStatus: TableStatus
): Promise<Table> {
    const res = await http.put<ApiResponse<Table>>(
        `/table/occupy/${encodeURIComponent(tableCode)}/${newStatus}`
    )
    return res.data.data
}
