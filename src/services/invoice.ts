import { http, type ApiResponse } from "./http"
import { fetchAllPages, type PageData } from "./pagination"

export interface Invoice {
    invoiceCode: string
    sessionCode: string
    tableFee: number
    fnbFee: number
    totalAmount: number
    // true once the invoice has been paid
    complete: boolean
    // when it was paid; null while unpaid
    paidAt: string | null
    createdAt: string
}

// Loads every page so that filtering and totals cover all invoices, not just the first page.
export async function getAllInvoices(): Promise<Invoice[]> {
    return fetchAllPages<Invoice>(
        async (page, size) => {
            const res = await http.get<ApiResponse<PageData<Invoice>>>("/invoice/all", {
                params: { page, size },
            })
            return res.data.data
        },
        (invoice) => invoice.invoiceCode
    )
}

// Checkout: ends the play session and bills it. Do not close the session first.
export async function createInvoice(sessionCode: string): Promise<Invoice> {
    const res = await http.post<ApiResponse<Invoice>>("/invoice/create", { sessionCode })
    return res.data.data
}

export async function completeInvoice(invoiceCode: string): Promise<void> {
    await http.put<ApiResponse<unknown>>("/invoice/complete", null, {
        params: { invoiceCode },
    })
}

// A bank-transfer QR image URL for the invoice's total.
export async function getInvoiceQr(invoiceCode: string): Promise<string> {
    const res = await http.get<ApiResponse<string>>("/invoice/qr", {
        params: { invoiceCode },
    })
    return res.data.data
}

export async function deleteInvoice(invoiceCode: string): Promise<void> {
    await http.delete<ApiResponse<unknown>>(`/invoice/${encodeURIComponent(invoiceCode)}`)
}
