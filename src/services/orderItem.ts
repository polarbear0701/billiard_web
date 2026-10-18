import { http, type ApiResponse } from "./http"

export interface OrderItem {
    orderItemCode: string
    sessionCode: string
    productCode: string
    quantity: number
}

export interface OrderItemLine {
    productCode: string
    quantity: number
}

// May come back as a bare array or a page object.
type OrderItemListData = OrderItem[] | { content: OrderItem[] }

export async function getOrderItemsBySession(sessionCode: string): Promise<OrderItem[]> {
    const res = await http.get<ApiResponse<OrderItemListData>>(
        `/order-item/all/${encodeURIComponent(sessionCode)}`
    )
    const data = res.data.data
    return Array.isArray(data) ? data : (data?.content ?? [])
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
