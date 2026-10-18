import { http, type ApiResponse } from "./http"

export interface Invoice {
    invoiceCode: string
    sessionCode: string
    tableFee: number
    fnbFee: number
    totalAmount: number
    isPaid: boolean
    createdAt: string | null
}

export type InvoiceQr =
    | { kind: "image"; src: string }
    | { kind: "payload"; value: string }

type RawRecord = Record<string, unknown>

// Maps the server's invoice JSON ("complete" = paid, plus tableFee / fnbFee / totalAmount).
// The fallbacks below only matter if those names change.
const TOTAL_KEYS = ["totalAmount", "totalPrice", "total", "amount", "finalAmount", "grandTotal"]
const STATUS_KEYS = ["invoiceStatus", "paymentStatus", "status", "state"]
const PAID_STATUS = /^(PAID|COMPLETED|COMPLETE|SUCCESS|SUCCEEDED)$/i
const DATE_KEYS = ["createdAt", "issuedAt", "createdDate", "invoiceDate"]
const QR_KEYS = ["qrUrl", "qrCode", "qr", "qrData", "qrImage", "url", "image", "data", "content"]

function pickString(raw: RawRecord, keys: string[]): string | null {
    for (const key of keys) {
        const value = raw[key]
        if (typeof value === "string" && value !== "") return value
    }
    return null
}

function pickNumber(raw: RawRecord, keys: string[]): number {
    for (const key of keys) {
        const value = raw[key]
        if (typeof value === "number") return value
        if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
            return Number(value)
        }
    }
    return 0
}

function toInvoice(raw: RawRecord): Invoice {
    const status = pickString(raw, STATUS_KEYS)
    const paidFlag = raw.complete ?? raw.paid ?? raw.isPaid

    return {
        invoiceCode: pickString(raw, ["invoiceCode"]) ?? "",
        sessionCode: pickString(raw, ["sessionCode"]) ?? "",
        tableFee: pickNumber(raw, ["tableFee"]),
        fnbFee: pickNumber(raw, ["fnbFee"]),
        totalAmount: pickNumber(raw, TOTAL_KEYS),
        isPaid: typeof paidFlag === "boolean" ? paidFlag : status !== null && PAID_STATUS.test(status),
        createdAt: pickString(raw, DATE_KEYS),
    }
}

// The list endpoint is paginated. A page is either a bare array or a Spring-style page object.
interface InvoicePage {
    content: RawRecord[]
    totalPages?: number
    totalElements?: number
    last?: boolean
}

type InvoiceListData = RawRecord[] | InvoicePage

const FETCH_PAGE_SIZE = 100
const MAX_PAGES = 100

async function fetchInvoicePage(page: number) {
    const res = await http.get<ApiResponse<InvoiceListData>>("/invoice/all", {
        params: { page, size: FETCH_PAGE_SIZE },
    })
    const data = res.data.data
    return {
        rows: Array.isArray(data) ? data : (data?.content ?? []),
        info: Array.isArray(data) ? undefined : data,
    }
}

// Loads every page so that filtering and totals cover all invoices, not just the first page.
// The server may cap the page size below what we ask for, so a short page does NOT mean the
// last page; only the page metadata (or an empty/repeated page) ends the loop.
export async function getAllInvoices(): Promise<Invoice[]> {
    const byCode = new Map<string, Invoice>()

    for (let page = 0; page < MAX_PAGES; page++) {
        const { rows, info } = await fetchInvoicePage(page)
        const sizeBefore = byCode.size
        for (const row of rows) {
            const invoice = toInvoice(row)
            byCode.set(invoice.invoiceCode, invoice)
        }

        const isLastPage =
            rows.length === 0 ||
            byCode.size === sizeBefore || // nothing new: the server ignored the page number
            (info?.last !== undefined
                ? info.last
                : info?.totalPages !== undefined
                  ? page + 1 >= info.totalPages
                  : info?.totalElements !== undefined
                    ? byCode.size >= info.totalElements
                    : rows.length < FETCH_PAGE_SIZE)

        if (isLastPage) break
    }

    return [...byCode.values()]
}

export async function createInvoice(sessionCode: string): Promise<Invoice> {
    const res = await http.post<ApiResponse<RawRecord>>("/invoice/create", { sessionCode })
    const invoice = toInvoice(res.data.data ?? {})

    if (!invoice.invoiceCode) {
        throw new Error("The server did not return an invoice code")
    }
    return { ...invoice, sessionCode: invoice.sessionCode || sessionCode }
}

export async function completeInvoice(invoiceCode: string): Promise<void> {
    await http.put<ApiResponse<unknown>>("/invoice/complete", null, {
        params: { invoiceCode },
    })
}

export async function getInvoiceQr(invoiceCode: string): Promise<InvoiceQr | null> {
    const res = await http.get<ApiResponse<unknown>>("/invoice/qr", {
        params: { invoiceCode },
    })
    const data = res.data.data
    const value =
        typeof data === "string"
            ? data
            : data && typeof data === "object"
              ? pickString(data as RawRecord, QR_KEYS)
              : null

    if (!value) return null
    if (/^(https?:|data:image)/i.test(value)) return { kind: "image", src: value }

    // A long run of base64 characters is an encoded image; bank QR payloads start with "000201".
    if (!value.startsWith("000201") && value.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
        return { kind: "image", src: `data:image/png;base64,${value.replace(/\s/g, "")}` }
    }
    return { kind: "payload", value }
}
