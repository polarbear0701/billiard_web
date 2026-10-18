import { useEffect, useState } from "react"
import { getAllProducts, type Product } from "../services/product"
import {
    cancelOrderItem,
    createOrderItems,
    getOrderItemsBySession,
    updateOrderItemQuantity,
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
    // Order item currently being edited or cancelled.
    const [pendingItemCode, setPendingItemCode] = useState<string | null>(null)
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

    const productByCode = new Map(products.map((product) => [product.productCode, product]))
    const unitPriceOf = (item: OrderItem) =>
        item.unitPrice ?? productByCode.get(item.productCode)?.price ?? 0

    const orderedByProduct = new Map<string, number>()
    for (const item of items) {
        orderedByProduct.set(
            item.productCode,
            (orderedByProduct.get(item.productCode) ?? 0) + item.quantity
        )
    }

    const orderedTotal = items.reduce(
        (sum, item) => sum + unitPriceOf(item) * item.quantity,
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

    async function refresh() {
        const data = await fetchMenuData(sessionCode)
        setProducts(data.products)
        setItems(data.items)
    }

    // Edits or cancels an already-ordered item, then re-reads the order from the server.
    async function editItem(item: OrderItem, action: () => Promise<void>) {
        if (!item.orderItemCode) {
            setError(t.menu.missingCode)
            return
        }

        setPendingItemCode(item.orderItemCode)
        setError("")
        try {
            await action()
            await refresh()
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setPendingItemCode(null)
        }
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
            await refresh()
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

            {!isLoading && items.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {t.menu.orderedItems}
                    </p>

                    <ul className="mt-2 divide-y divide-slate-200 rounded-2xl bg-emerald-50/60 px-4">
                        {items.map((item) => {
                            const product = productByCode.get(item.productCode)
                            const isPending = pendingItemCode === item.orderItemCode
                            const isBusy = isPending || isSubmitting

                            return (
                                <li
                                    key={item.orderItemCode || item.productCode}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {product?.name ?? item.productCode}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatPrice(unitPriceOf(item) * item.quantity)}
                                            <button
                                                type="button"
                                                className="ml-3 font-medium text-rose-600 hover:underline disabled:opacity-40"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    editItem(item, () => cancelOrderItem(item.orderItemCode))
                                                }
                                            >
                                                {t.menu.remove}
                                            </button>
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            aria-label={t.menu.removeOne}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
                                            disabled={item.quantity <= 1 || isBusy}
                                            onClick={() =>
                                                editItem(item, () =>
                                                    updateOrderItemQuantity(item.orderItemCode, item.quantity - 1)
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span className="w-6 text-center text-sm font-semibold text-emerald-700">
                                            {isPending ? (
                                                <span className="loading loading-dots loading-xs" />
                                            ) : (
                                                item.quantity
                                            )}
                                        </span>

                                        <button
                                            type="button"
                                            aria-label={t.menu.addOne}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-xl text-white transition hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                                            disabled={(product?.quantity ?? 0) <= 0 || isBusy}
                                            onClick={() =>
                                                editItem(item, () =>
                                                    updateOrderItemQuantity(item.orderItemCode, item.quantity + 1)
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>

                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {t.menu.addItems}
                    </p>
                </div>
            )}

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
