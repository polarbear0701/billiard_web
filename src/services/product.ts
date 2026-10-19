import { http, type ApiResponse } from "./http"
import { fetchAllPages, type PageData } from "./pagination"

export interface Product {
    productCode: string
    name: string
    quantity: number
    price: number
}

export type StockLevel = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

export const LOW_STOCK_THRESHOLD = 10

export function getStockLevel(quantity: number): StockLevel {
    if (quantity <= 0) return "OUT_OF_STOCK"
    if (quantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK"
    return "IN_STOCK"
}

export interface ProductRequest {
    name: string
    quantity: number
    price: number
}

// Loads every page so the stock list and menu cover all products.
export async function getAllProducts(): Promise<Product[]> {
    return fetchAllPages<Product>(
        async (page, size) => {
            const res = await http.get<ApiResponse<PageData<Product>>>("/product/all", {
                params: { page, size },
            })
            return res.data.data
        },
        (product) => product.productCode
    )
}

export async function createProduct(request: ProductRequest): Promise<void> {
    await http.post<ApiResponse<unknown>>("/product/create", request)
}

export async function updateProductName(
    productCode: string,
    newProductName: string
): Promise<void> {
    await http.put<ApiResponse<unknown>>(
        `/product/update/name/${encodeURIComponent(productCode)}`,
        null,
        { params: { newProductName } }
    )
}

export async function updateProductPrice(
    productCode: string,
    newPrice: number
): Promise<void> {
    await http.put<ApiResponse<unknown>>(
        `/product/update/price/${encodeURIComponent(productCode)}`,
        null,
        { params: { newPrice } }
    )
}

export async function adjustProductQuantity(
    productCode: string,
    amountToUpdate: number,
    decrement: boolean
): Promise<void> {
    await http.put<ApiResponse<unknown>>(
        `/product/update/quantity/${encodeURIComponent(productCode)}`,
        { amountToUpdate, decrement }
    )
}

export async function clearProductStock(productCode: string): Promise<void> {
    await http.put<ApiResponse<unknown>>(
        `/product/update/clear/${encodeURIComponent(productCode)}`
    )
}

export async function deleteProduct(productCode: string): Promise<void> {
    await http.delete<ApiResponse<unknown>>(
        `/product/${encodeURIComponent(productCode)}`
    )
}
