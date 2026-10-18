import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
    completeInvoice,
    getInvoiceQr,
    type Invoice,
    type InvoiceQr,
} from "../services/invoice"
import { getOrderItemsBySession, type OrderItem } from "../services/orderItem"
import { getAllProducts, type Product } from "../services/product"
import { getPlaySessionByCode, type PlaySession } from "../services/playSession"
import { formatTableCode } from "../services/table"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import { formatDateTime, minutesBetween } from "../i18n/formatDateTime"
import Modal from "./Modal"
import { primaryButtonClass, secondaryButtonClass } from "./formStyles"
import { formatPrice } from "./statusStyles"

interface InvoiceModalProps {
    invoice: Invoice
    onClose: () => void
    // Called after the invoice was marked as paid.
    onPaid?: () => void
}

interface InvoiceDetails {
    session: PlaySession | null
    items: OrderItem[]
    products: Product[]
    hasError: boolean
}

// Each piece loads independently, so a missing one doesn't hide the rest of the invoice.
async function fetchDetails(sessionCode: string): Promise<InvoiceDetails> {
    const [session, items, products] = await Promise.allSettled([
        getPlaySessionByCode(sessionCode),
        getOrderItemsBySession(sessionCode),
        getAllProducts(),
    ])

    return {
        session: session.status === "fulfilled" ? session.value : null,
        items: items.status === "fulfilled" ? items.value : [],
        products: products.status === "fulfilled" ? products.value : [],
        hasError: [session, items, products].some((result) => result.status === "rejected"),
    }
}

export default function InvoiceModal({ invoice, onClose, onPaid }: InvoiceModalProps) {
    const { t } = useLanguage()

    return (
        <Modal title={t.invoice.title} onClose={onClose} maxWidth="max-w-md">
            {(close) => <InvoiceContent invoice={invoice} close={close} onPaid={onPaid} />}
        </Modal>
    )
}

function InvoiceContent({
    invoice,
    close,
    onPaid,
}: {
    invoice: Invoice
    close: () => void
    onPaid?: () => void
}) {
    const { t, language } = useLanguage()
    const [details, setDetails] = useState<InvoiceDetails | null>(null)
    const [qr, setQr] = useState<InvoiceQr | null>(null)
    const [isQrLoading, setIsQrLoading] = useState(!invoice.isPaid)
    const [qrError, setQrError] = useState("")
    const [isCompleting, setIsCompleting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let isCancelled = false

        async function loadDetails() {
            const data = invoice.sessionCode
                ? await fetchDetails(invoice.sessionCode)
                : { session: null, items: [], products: [], hasError: false }
            if (!isCancelled) setDetails(data)
        }

        loadDetails()

        return () => {
            isCancelled = true
        }
    }, [invoice.sessionCode])

    useEffect(() => {
        if (invoice.isPaid) return

        let isCancelled = false

        async function loadQr() {
            try {
                const data = await getInvoiceQr(invoice.invoiceCode)
                if (!isCancelled) setQr(data)
            } catch (err) {
                if (!isCancelled) setQrError(getErrorMessage(err))
            } finally {
                if (!isCancelled) setIsQrLoading(false)
            }
        }

        loadQr()

        return () => {
            isCancelled = true
        }
    }, [invoice.invoiceCode, invoice.isPaid])

    async function markPaid() {
        setIsCompleting(true)
        setError("")
        try {
            await completeInvoice(invoice.invoiceCode)
            onPaid?.()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsCompleting(false)
        }
    }

    const productByCode = new Map(details?.products.map((p) => [p.productCode, p]))
    const minutes = details?.session
        ? minutesBetween(details.session.startTime, details.session.endTime)
        : null
    const duration =
        minutes === null
            ? "—"
            : t.invoice.durationFormat
                  .replace("{h}", String(Math.floor(minutes / 60)))
                  .replace("{m}", String(minutes % 60))

    const rowClass = "flex items-center justify-between gap-4 py-3"

    return (
        <>
            <div id="invoice-receipt">
                <p className="hidden text-center text-xl font-semibold print:block">
                    {t.nav.brand}
                </p>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center print:mt-2">
                    <p className="text-sm text-slate-500">{t.invoice.total}</p>
                    <p className="mt-1 text-3xl font-semibold text-amber-600">
                        {formatPrice(invoice.totalAmount)}
                    </p>
                    <span
                        className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            invoice.isPaid
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                    >
                        {invoice.isPaid ? t.invoice.status.PAID : t.invoice.status.UNPAID}
                    </span>
                </div>

                <dl className="mt-4 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4 text-sm">
                    <div className={rowClass}>
                        <dt className="text-slate-500">{t.invoice.invoiceCode}</dt>
                        <dd className="font-medium text-slate-900">{invoice.invoiceCode}</dd>
                    </div>
                    <div className={rowClass}>
                        <dt className="text-slate-500">{t.invoice.sessionCode}</dt>
                        <dd className="font-medium text-slate-900">{invoice.sessionCode || "—"}</dd>
                    </div>
                    {invoice.createdAt && (
                        <div className={rowClass}>
                            <dt className="text-slate-500">{t.invoice.createdAt}</dt>
                            <dd className="font-medium text-slate-900">
                                {formatDateTime(invoice.createdAt, language)}
                            </dd>
                        </div>
                    )}
                </dl>

                <section className="mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">
                            {t.invoice.details}
                        </h3>

                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 print:hidden"
                            onClick={() => window.print()}
                        >
                            {t.invoice.print}
                        </button>
                    </div>

                    {details === null ? (
                        <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-center">
                            <span className="loading loading-dots loading-sm text-slate-400" />
                        </p>
                    ) : (
                        <>
                            <dl className="mt-3 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4 text-sm">
                                <div className={rowClass}>
                                    <dt className="text-slate-500">{t.invoice.table}</dt>
                                    <dd className="font-medium text-slate-900">
                                        {details.session
                                            ? formatTableCode(details.session.tableCode, t.tables.tableLabel)
                                            : "—"}
                                    </dd>
                                </div>
                                <div className={rowClass}>
                                    <dt className="text-slate-500">{t.invoice.start}</dt>
                                    <dd className="font-medium text-slate-900">
                                        {details.session
                                            ? formatDateTime(details.session.startTime, language)
                                            : "—"}
                                    </dd>
                                </div>
                                <div className={rowClass}>
                                    <dt className="text-slate-500">{t.invoice.end}</dt>
                                    <dd className="font-medium text-slate-900">
                                        {details.session?.endTime
                                            ? formatDateTime(details.session.endTime, language)
                                            : "—"}
                                    </dd>
                                </div>
                                <div className={rowClass}>
                                    <dt className="text-slate-500">{t.invoice.duration}</dt>
                                    <dd className="font-medium text-slate-900">{duration}</dd>
                                </div>
                                <div className={rowClass}>
                                    <dt className="text-slate-500">{t.invoice.tableFee}</dt>
                                    <dd className="font-semibold text-slate-900">
                                        {formatPrice(invoice.tableFee)}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                                {t.invoice.items}
                            </p>

                            <ul className="mt-2 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4 text-sm">
                                {details.items.length === 0 ? (
                                    <li className="py-3 text-slate-500">{t.invoice.noItems}</li>
                                ) : (
                                    details.items.map((item) => {
                                        const product = productByCode.get(item.productCode)
                                        const unitPrice = item.unitPrice ?? product?.price ?? 0

                                        return (
                                            <li
                                                key={item.orderItemCode || item.productCode}
                                                className={rowClass}
                                            >
                                                <span className="min-w-0 text-slate-900">
                                                    <span className="block truncate font-medium">
                                                        {product?.name ?? item.productCode}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {item.quantity} × {formatPrice(unitPrice)}
                                                    </span>
                                                </span>
                                                <span className="font-medium text-slate-900">
                                                    {formatPrice(unitPrice * item.quantity)}
                                                </span>
                                            </li>
                                        )
                                    })
                                )}

                                <li className={rowClass}>
                                    <span className="text-slate-500">{t.invoice.fnbFee}</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatPrice(invoice.fnbFee)}
                                    </span>
                                </li>
                            </ul>

                            {details.hasError && (
                                <p className="mt-2 text-xs text-amber-700 print:hidden">
                                    {t.invoice.detailsError}
                                </p>
                            )}
                        </>
                    )}
                </section>
            </div>

            {invoice.isPaid ? (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {t.invoice.paidNote}
                </p>
            ) : (
                <section className="mt-6 text-center">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {t.invoice.scanToPay}
                    </h3>

                    <div className="mx-auto mt-3 flex min-h-56 w-56 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                        {isQrLoading ? (
                            <span className="loading loading-dots loading-md text-slate-400" />
                        ) : qr?.kind === "image" ? (
                            <img src={qr.src} alt={t.invoice.scanToPay} className="h-full w-full object-contain" />
                        ) : qr?.kind === "payload" ? (
                            <QRCodeSVG value={qr.value} size={200} />
                        ) : (
                            <p className="px-2 text-sm text-slate-500">
                                {qrError || t.invoice.qrUnavailable}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <div className={`mt-8 grid gap-4 ${invoice.isPaid ? "" : "grid-cols-2"}`}>
                <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={close}
                    disabled={isCompleting}
                >
                    {t.common.close}
                </button>

                {!invoice.isPaid && (
                    <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={markPaid}
                        disabled={isCompleting}
                    >
                        {isCompleting ? (
                            <span className="loading loading-dots loading-sm" />
                        ) : (
                            t.invoice.markPaid
                        )}
                    </button>
                )}
            </div>
        </>
    )
}
