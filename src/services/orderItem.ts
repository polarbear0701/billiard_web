import { http, type ApiResponse } from "./http"

export interface OrderItem {
    orderItemCode: string
    sessionCode: string
    productCode: string
    quantity: number
    // Price per unit at order time, when the server provides it.
    unitPrice: number | null
}

export interface OrderItemLine {
    productCode: string
    quantity: number
}

type RawRecord = Record<string, unknown>

const CODE_KEYS = ["orderItemCode", "itemCode", "code"]
const PRICE_KEYS = ["unitPrice", "price", "priceAtOrder", "productPrice"]
const STATUS_KEYS = ["status", "orderStatus", "itemStatus"]
const NOT_AN_ITEM_CODE = new Set(["sessionCode", "productCode", "tableCode", "invoiceCode"])

function pickString(raw: RawRecord, keys: string[]): string | null {
    for (const key of keys) {
        const value = raw[key]
        if (typeof value === "string" && value !== "") return value
    }
    return null
}

function pickNumber(raw: RawRecord, keys: string[]): number | null {
    for (const key of keys) {
        const value = raw[key]
        if (typeof value === "number") return value
        if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
            return Number(value)
        }
    }
    return null
}

function isCancelled(raw: RawRecord): boolean {
    if (raw.cancelled === true || raw.canceled === true) return true
    const status = pickString(raw, STATUS_KEYS)
    return status !== null && /^CANCEL/i.test(status)
}

// If none of the usual names is present, fall back to any other "...Code" field.
function pickItemCode(raw: RawRecord): string {
    const direct = pickString(raw, CODE_KEYS)
    if (direct) return direct

    const guessed = Object.keys(raw).find(
        (key) => /code$/i.test(key) && !NOT_AN_ITEM_CODE.has(key) && typeof raw[key] === "string"
    )
    return guessed ? (raw[guessed] as string) : ""
}

function toOrderItem(raw: RawRecord): OrderItem {
    return {
        orderItemCode: pickItemCode(raw),
        sessionCode: pickString(raw, ["sessionCode"]) ?? "",
        productCode: pickString(raw, ["productCode"]) ?? "",
        quantity: pickNumber(raw, ["quantity"]) ?? 0,
        unitPrice: pickNumber(raw, PRICE_KEYS),
    }
}

// May come back as a bare array or a page object. Cancelled items are left out.
type OrderItemListData = RawRecord[] | { content: RawRecord[] }

export async function getOrderItemsBySession(sessionCode: string): Promise<OrderItem[]> {
    const res = await http.get<ApiResponse<OrderItemListData>>(
        `/order-item/all/${encodeURIComponent(sessionCode)}`
    )
    const data = res.data.data
    const rows = Array.isArray(data) ? data : (data?.content ?? [])
    return rows.filter((row) => !isCancelled(row)).map(toOrderItem)
}

export async function createOrderItems(
    sessionCode: string,
    items: OrderItemLine[]
): Promise<void> {
    await http.post<ApiResponse<unknown>>("/order-item/create", {
        sessionCode,
        items,
    })
}

export async function updateOrderItemQuantity(
    orderItemCode: string,
    newQuantity: number
): Promise<void> {
    await http.put<ApiResponse<unknown>>("/order-item/update/quantity", null, {
        params: { orderItemCode, newQuantity },
    })
}

export async function cancelOrderItem(orderItemCode: string): Promise<void> {
    await http.post<ApiResponse<unknown>>(
        `/order-item/cancel/${encodeURIComponent(orderItemCode)}`
    )
}
