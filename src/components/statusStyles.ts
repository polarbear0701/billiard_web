import type { TableStatus } from "../services/table"

export const statusStyles: Record<TableStatus, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700",
    OCCUPIED: "bg-rose-50 text-rose-700",
    MAINTENANCE: "bg-orange-50 text-orange-700",
}

export function formatPrice(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value)
}
