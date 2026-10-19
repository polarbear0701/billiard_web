import { http, type ApiResponse } from "./http"

export interface OrderItem {
    orderItemCode: string
    sessionCode: string
    productCode: string
    productName: string
    quantity: number
    // Unit price in VND at the time it was ordered.
    price: number
}

export interface OrderItemLine {
    productCode: string
    quantity: number
}

export async function getOrderItemsBySession(sessionCode: string): Promise<OrderItem[]> {
    const res = await http.get<ApiResponse<OrderItem[]>>(
        `/order-item/all/${encodeURIComponent(sessionCode)}`
    )
    return res.data.data ?? []
}

// Each line's quantity is taken out of stock. Returns the created order lines.
export async function createOrderItems(
    sessionCode: string,
    items: OrderItemLine[]
): Promise<OrderItem[]> {
    const res = await http.post<ApiResponse<OrderItem[]>>("/order-item/create", {
        sessionCode,
        items,
    })
    return res.data.data ?? []
}

// The new quantity must be greater than 0 and different from the current one.
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
