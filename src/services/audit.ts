import { http, type ApiResponse } from "./http"

export const AUDIT_ENTITY_TYPES = ["Product", "BilliardTable", "PlaySession", "OrderItem", "Invoice"] as const
export const AUDIT_ACTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "END",
    "COMPLETE",
    "CANCEL",
    "UPDATE_STOCK",
    "UPDATE_PRICE",
    "UPDATE_NAME",
    "CLEAR_STOCK",
    "UPDATE_STATUS",
    "UPDATE_QUANTITY",
    "ADJUST_START_TIME",
] as const

export interface AuditFilters {
    actor: string
    entityType: string // one of AUDIT_ENTITY_TYPES, or "" for all
    entityCode: string
    action: string // one of AUDIT_ACTIONS, or "" for all
    from: string // yyyy-MM-dd, or ""
    to: string // yyyy-MM-dd, or ""
}

export interface AuditEntry {
    id: string
    // ISO date-time in the store's timezone
    occurredAt: string
    // "SYSTEM" when there was no logged-in user
    actor: string
    action: string
    entityType: string
    entityCode: string
    // Snapshots of the record before and after; null for create and delete respectively.
    oldValue: Record<string, unknown> | null
    newValue: Record<string, unknown> | null
}

export interface AuditPage {
    content: AuditEntry[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

export const AUDIT_PAGE_SIZE = 20

function nextDay(date: string) {
    const [year, month, day] = date.split("-").map(Number)
    const next = new Date(year, month - 1, day + 1)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

export async function searchAuditLogs(filters: AuditFilters, page: number): Promise<AuditPage> {
    const res = await http.get<ApiResponse<AuditPage>>("/audit-logs", {
        params: {
            actor: filters.actor.trim() || undefined,
            entityType: filters.entityType || undefined,
            entityCode: filters.entityCode.trim() || undefined,
            action: filters.action || undefined,
            // `from` is inclusive and `to` is exclusive, so "to" a day means the start of the next.
            from: filters.from ? `${filters.from}T00:00:00` : undefined,
            to: filters.to ? `${nextDay(filters.to)}T00:00:00` : undefined,
            page,
            size: AUDIT_PAGE_SIZE,
            direction: "desc",
        },
    })

    return res.data.data
}

const IGNORED_FIELDS = new Set(["createdAt", "updatedAt", "createdBy", "updatedBy"])

export interface FieldChange {
    field: string
    from: string | null
    to: string | null
}

const show = (value: unknown) =>
    value === null || value === undefined ? null : typeof value === "object" ? JSON.stringify(value) : String(value)

// The fields that differ between the snapshots (for a create or delete, the fields of the
// one snapshot there is), leaving out bookkeeping such as timestamps.
export function describeChange(
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null
): FieldChange[] {
    const fields = new Set([...Object.keys(oldValue ?? {}), ...Object.keys(newValue ?? {})])

    return [...fields]
        .filter((field) => !IGNORED_FIELDS.has(field))
        .map((field) => ({ field, from: show(oldValue?.[field]), to: show(newValue?.[field]) }))
        .filter((change) => change.from !== change.to)
}
