import { useEffect, useState } from "react"
import { getAllProducts, type Product } from "../services/product"
import {
    createOrderItems,
    getOrderItemsBySession,
    type OrderItem,
} from "../services/orderItem"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import { formatPrice } from "./statusStyles"

interface SessionMenuProps {
    sessionCode: string
}

async function fetchMenuData(sessionCode: string) {
    const [products, items] = await Promise.all([
        getAllProducts(),
        getOrderItemsBySession(sessionCode),
    ])
    return { products, items }
}

export default function SessionMenu({ sessionCode }: SessionMenuProps) {
    const { t } = useLanguage()
    const [products, setProducts] = useState<Product[]>([])
    const [items, setItems] = useState<OrderItem[]>([])
    // Quantities picked but not sent yet, keyed by product code.
    const [draft, setDraft] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let isCancelled = false

        async function load() {
            try {
                const data = await fetchMenuData(sessionCode)
                if (isCancelled) return
                setProducts(data.products)
                setItems(data.items)
            } catch (err) {
                if (!isCancelled) setError(getErrorMessage(err))
            } finally {
                if (!isCancelled) setIsLoading(false)
            }
        }

        load()

        return () => {
            isCancelled = true
        }
    }, [sessionCode])

    const orderedByProduct = new Map<string, number>()
    for (const item of items) {
        orderedByProduct.set(
            item.productCode,
            (orderedByProduct.get(item.productCode) ?? 0) + item.quantity
        )
    }

    const orderedTotal = products.reduce(
        (sum, p) => sum + p.price * (orderedByProduct.get(p.productCode) ?? 0),
        0
    )
    const draftLines = products
        .filter((p) => (draft[p.productCode] ?? 0) > 0)
        .map((p) => ({ product: p, quantity: draft[p.productCode] }))
    const draftCount = draftLines.reduce((sum, line) => sum + line.quantity, 0)
    const draftTotal = draftLines.reduce(
        (sum, line) => sum + line.product.price * line.quantity,
        0
    )

    function changeDraft(product: Product, delta: 1 | -1) {
        setDraft((prev) => {
            const next = Math.max(
                0,
                Math.min(product.quantity, (prev[product.productCode] ?? 0) + delta)
            )
            return { ...prev, [product.productCode]: next }
        })
    }

    async function confirmOrder() {
        setIsSubmitting(true)
        setError("")
        try {
            await createOrderItems(
                sessionCode,
                draftLines.map((line) => ({
                    productCode: line.product.productCode,
                    quantity: line.quantity,
                }))
            )

            // Re-read so ordered quantities and remaining stock match the server.
            const data = await fetchMenuData(sessionCode)
            setProducts(data.products)
            setItems(data.items)
            setDraft({})
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="mt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{t.menu.title}</h3>

                <p className="text-sm text-slate-500">
                    {t.menu.orderTotal}:{" "}
                    <span className="font-semibold text-amber-600">
                        {formatPrice(orderedTotal)}
                    </span>
                </p>
            </div>

            {isLoading ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    {t.menu.loading}
                </p>
            ) : products.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    {t.menu.empty}
                </p>
            ) : (
                <ul className="mt-3 max-h-72 divide-y divide-slate-200 overflow-y-auto rounded-2xl bg-slate-50 px-4">
                    {products.map((product) => {
                        const ordered = orderedByProduct.get(product.productCode) ?? 0
                        const picked = draft[product.productCode] ?? 0
                        const isOutOfStock = product.quantity <= 0

                        return (
                            <li
                                key={product.productCode}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatPrice(product.price)}
                                        {ordered > 0 && (
                                            <span className="ml-2 font-medium text-emerald-700">
                                                {t.menu.ordered}: {ordered}
                                            </span>
                                        )}
                                        <span
                                            className={`ml-2 ${
                                                isOutOfStock ? "text-rose-600" : "text-slate-500"
                                            }`}
                                        >
                                            {isOutOfStock
                                                ? t.stock.level.OUT_OF_STOCK
                                                : `${t.menu.inStock}: ${product.quantity}`}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label={t.menu.removeOne}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
                                        disabled={picked === 0 || isSubmitting}
                                        onClick={() => changeDraft(product, -1)}
                                    >
                                        −
                                    </button>

                                    <span
                                        className={`w-6 text-center text-sm font-semibold ${
                                            picked > 0 ? "text-emerald-700" : "text-slate-400"
                                        }`}
                                    >
                                        {picked}
                                    </span>

                                    <button
                                        type="button"
                                        aria-label={t.menu.addOne}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-xl text-white transition hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                                        disabled={picked >= product.quantity || isSubmitting}
                                        onClick={() => changeDraft(product, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {draftCount > 0 && (
                <button
                    type="button"
                    className="btn mt-3 h-12 w-full rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                    disabled={isSubmitting}
                    onClick={confirmOrder}
                >
                    {isSubmitting ? (
                        <span className="loading loading-dots loading-sm" />
                    ) : (
                        `${t.menu.confirm} · ${t.menu.confirmItems.replace("{count}", String(draftCount))} · ${formatPrice(draftTotal)}`
                    )}
                </button>
            )}

            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </section>
    )
}
