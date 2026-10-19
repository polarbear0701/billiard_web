// Server timestamps carry nanoseconds and no timezone; keep milliseconds so Date can parse them.
export function parseServerDate(value: string): Date | null {
    const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"))
    return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value: string, language: string) {
    const date = parseServerDate(value)
    if (!date) return value

    return date.toLocaleString(language === "vi" ? "vi-VN" : "en-GB", {
        dateStyle: "short",
        timeStyle: "short",
    })
}

// Whole minutes between two server timestamps, or null if either is missing/invalid.
export function minutesBetween(start: string, end: string | null): number | null {
    const from = parseServerDate(start)
    const to = end ? parseServerDate(end) : null
    if (!from || !to) return null
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000))
}

const pad = (n: number) => String(n).padStart(2, "0")

// Moves a server timestamp by whole minutes and writes it back in the server's own
// local format ("YYYY-MM-DDTHH:mm:ss"), so no timezone conversion is involved.
export function shiftServerTime(value: string, minutes: number): string | null {
    const date = parseServerDate(value)
    if (!date) return null

    date.setMinutes(date.getMinutes() + minutes)
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    )
}
