import { useEffect, useState } from "react"
import { ConfirmModal, InvoiceModal } from "../components"
import { formatPrice } from "../components/statusStyles"
import { formatDateTime } from "../i18n/formatDateTime"
import { useLanguage } from "../i18n/useLanguage"
import { getErrorMessage } from "../services/http"
import { isAdminUser } from "../services/auth"
import { deleteInvoice, getAllInvoices, type Invoice } from "../services/invoice"

type PaidFilter = "ALL" | "UNPAID" | "PAID"

const PAGE_SIZE = 10

const filterOptions: PaidFilter[] = ["ALL", "UNPAID", "PAID"]

export default function Invoices() {
    const { t, language } = useLanguage()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [reloadKey, setReloadKey] = useState(0)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<PaidFilter>("ALL")
    const [page, setPage] = useState(0)
    const [selected, setSelected] = useState<Invoice | null>(null)
    const [toDelete, setToDelete] = useState<Invoice | null>(null)
    const isAdmin = isAdminUser()

    useEffect(() => {
        let isCancelled = false

        async function fetchInvoices() {
            try {
                const data = await getAllInvoices()
                if (isCancelled) return

                // Newest first.
                setInvoices(
                    [...data].sort((a, b) =>
                        b.createdAt.localeCompare(a.createdAt)
                    )
                )
                setError("")
            } catch (err) {
                if (!isCancelled) setError(getErrorMessage(err))
            } finally {
                if (!isCancelled) setIsLoading(false)
            }
        }

        fetchInvoices()

        return () => {
            isCancelled = true
        }
    }, [reloadKey])

    if (isLoading) {
        return <p className="p-6">{t.invoices.loading}</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    const unpaid = invoices.filter((invoice) => !invoice.complete)
    const outstanding = unpaid.reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    const filterLabel: Record<PaidFilter, string> = {
        ALL: t.invoices.all,
        UNPAID: t.invoice.status.UNPAID,
        PAID: t.invoice.status.PAID,
    }

    const keyword = search.trim().toLowerCase()
    const visibleInvoices = invoices.filter((invoice) => {
        if (filter === "PAID" && !invoice.complete) return false
        if (filter === "UNPAID" && invoice.complete) return false
        if (!keyword) return true
        return (
            invoice.invoiceCode.toLowerCase().includes(keyword) ||
            invoice.sessionCode.toLowerCase().includes(keyword)
        )
    })

    const pageCount = Math.max(1, Math.ceil(visibleInvoices.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount - 1)
    const pageStart = currentPage * PAGE_SIZE
    const pageInvoices = visibleInvoices.slice(pageStart, pageStart + PAGE_SIZE)

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-emerald-50">
                        {t.invoices.totalInvoices}
                    </p>
                    <p className="mt-4 text-4xl font-semibold">{invoices.length}</p>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-lg font-medium text-slate-700">{t.invoice.status.UNPAID}</p>
                    <p className="mt-4 text-4xl font-semibold text-amber-600">{unpaid.length}</p>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-lg font-medium text-slate-700">{t.invoice.status.PAID}</p>
                    <p className="mt-4 text-4xl font-semibold text-emerald-600">
                        {invoices.length - unpaid.length}
                    </p>
                </div>

                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-slate-700">{t.invoices.outstanding}</p>
                    <p className="mt-4 text-3xl font-semibold text-rose-600">
                        {formatPrice(outstanding)}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="search"
                    placeholder={t.invoices.searchPlaceholder}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(0)
                    }}
                    className="h-12 min-w-0 flex-1 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />

                <div role="group" className="flex rounded-xl bg-white p-1 shadow-sm">
                    {filterOptions.map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={filter === option}
                            onClick={() => {
                                setFilter(option)
                                setPage(0)
                            }}
                            className={`flex-1 rounded-lg px-4 text-sm font-medium transition sm:flex-none ${
                                filter === option
                                    ? "bg-emerald-700 text-white"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {filterLabel[option]}
                        </button>
                    ))}
                </div>
            </div>

            {visibleInvoices.length === 0 ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    {t.invoices.noMatch}
                </p>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                    <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <th className="px-5 py-4 font-medium">{t.invoices.invoiceCode}</th>
                                <th className="hidden px-5 py-4 font-medium md:table-cell">{t.invoices.sessionCode}</th>
                                <th className="hidden px-5 py-4 font-medium sm:table-cell">{t.invoices.date}</th>
                                <th className="px-5 py-4 font-medium">{t.invoices.total}</th>
                                <th className="px-5 py-4 font-medium">{t.invoices.status}</th>
                                <th className="px-5 py-4" />
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {pageInvoices.map((invoice) => (
                                <tr key={invoice.invoiceCode} className="transition hover:bg-slate-50">
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {invoice.invoiceCode}
                                    </td>

                                    <td className="hidden px-5 py-4 text-slate-500 md:table-cell">
                                        {invoice.sessionCode || "—"}
                                    </td>

                                    <td className="hidden px-5 py-4 text-slate-500 sm:table-cell">
                                        {formatDateTime(invoice.createdAt, language)}
                                    </td>

                                    <td className="px-5 py-4 font-medium text-amber-600">
                                        {formatPrice(invoice.totalAmount)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                invoice.complete
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-amber-50 text-amber-700"
                                            }`}
                                        >
                                            {invoice.complete ? t.invoice.status.PAID : t.invoice.status.UNPAID}
                                        </span>
                                        {invoice.paidAt && (
                                            <p className="mt-1 text-xs text-slate-400">
                                                {formatDateTime(invoice.paidAt, language)}
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-4 text-sm font-medium">
                                            <button
                                                type="button"
                                                className="text-emerald-700 hover:underline"
                                                onClick={() => setSelected(invoice)}
                                            >
                                                {invoice.complete ? t.invoices.view : t.invoices.pay}
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className="text-rose-600 hover:underline"
                                                    onClick={() => setToDelete(invoice)}
                                                >
                                                    {t.invoices.delete}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row">
                        <p>
                            {t.invoices.showing
                                .replace("{from}", String(pageStart + 1))
                                .replace("{to}", String(pageStart + pageInvoices.length))
                                .replace("{total}", String(visibleInvoices.length))}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                disabled={currentPage === 0}
                                onClick={() => setPage(currentPage - 1)}
                            >
                                {t.invoices.previous}
                            </button>

                            <span>
                                {t.invoices.pageOf
                                    .replace("{page}", String(currentPage + 1))
                                    .replace("{pages}", String(pageCount))}
                            </span>

                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                disabled={currentPage >= pageCount - 1}
                                onClick={() => setPage(currentPage + 1)}
                            >
                                {t.invoices.next}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toDelete && (
                <ConfirmModal
                    title={t.invoices.deleteTitle}
                    message={t.invoices.deleteMessage.replace("{code}", toDelete.invoiceCode)}
                    confirmLabel={t.invoices.deleteConfirm}
                    onConfirm={() => deleteInvoice(toDelete.invoiceCode)}
                    onClose={() => setToDelete(null)}
                    onDone={() => setReloadKey((key) => key + 1)}
                />
            )}

            {selected && (
                <InvoiceModal
                    invoice={selected}
                    onClose={() => setSelected(null)}
                    onPaid={() => setReloadKey((key) => key + 1)}
                />
            )}
        </div>
    )
}
