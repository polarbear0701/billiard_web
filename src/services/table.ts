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
