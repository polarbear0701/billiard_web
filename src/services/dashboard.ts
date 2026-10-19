import { http, type ApiResponse } from "./http"
import type { TableStatus, TableType } from "./table"

export type Granularity = "HOUR" | "DAY" | "MONTH"
export type TopProductsBy = "REVENUE" | "QUANTITY"

// Hourly buckets are only allowed for ranges of up to this many days.
export const MAX_HOURLY_DAYS = 31

export interface DateRange {
    from: string // yyyy-MM-dd, inclusive
    to: string // yyyy-MM-dd, inclusive
}

// Revenue counts paid invoices only, from the moment they were paid.
export interface Summary {
    revenue: number
    tableRevenue: number
    fnbRevenue: number
    invoiceCount: number
    averageInvoice: number
    previous: { revenue: number; invoiceCount: number }
    // null when the previous period had no revenue
    revenueChangePercent: number | null
}

export interface RevenuePoint {
    bucket: string
    revenue: number
    tableRevenue: number
    fnbRevenue: number
    invoiceCount: number
}

export interface TableUtilization {
    tableCode: string
    tableType: TableType
    currentStatus: TableStatus
    sessionCount: number
    playedMinutes: number
    utilizationPercent: number
    tableRevenue: number
}

export interface TableOverview {
    // How many tables have each status right now (not for the period).
    statusCounts: Partial<Record<TableStatus, number>>
    tables: TableUtilization[]
}

export interface TopProduct {
    productCode: string
    name: string
    quantitySold: number
    revenue: number
}

export interface LowStockProduct {
    productCode: string
    name: string
    quantity: number
}

async function get<T>(path: string, params: object): Promise<T> {
    const res = await http.get<ApiResponse<T>>(path, { params })
    return res.data.data
}

export const getSummary = (range: DateRange) => get<Summary>("/dashboard/summary", range)

export async function getRevenueSeries(
    range: DateRange,
    granularity: Granularity
): Promise<RevenuePoint[]> {
    const series = await get<{ points: RevenuePoint[] }>("/dashboard/revenue", {
        ...range,
        granularity,
    })
    return series.points
}

export const getTableOverview = (range: DateRange) =>
    get<TableOverview>("/dashboard/tables", range)

export const getTopProducts = (range: DateRange, by: TopProductsBy, limit = 5) =>
    get<TopProduct[]>("/dashboard/products/top", { ...range, by, limit })

export const getLowStock = (threshold: number) =>
    get<LowStockProduct[]>("/dashboard/products/low-stock", { threshold })
