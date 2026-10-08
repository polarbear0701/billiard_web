import { http, type ApiResponse } from "./http"

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"

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

// "TBL0007" -> "Table 7"; falls back to the raw code if it doesn't match.
export function formatTableCode(code: string): string {
    const match = /^TBL0*(\d+)$/i.exec(code)
    return match ? `Table ${match[1]}` : code
}
