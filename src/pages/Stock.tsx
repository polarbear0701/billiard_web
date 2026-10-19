import { useEffect, useState } from "react"
import { AdjustStockModal, DeleteProductModal, ProductFormModal } from "../components"
import { formatPrice } from "../components/statusStyles"
import { useLanguage } from "../i18n/useLanguage"
import { isAdminUser } from "../services/auth"
import { getErrorMessage } from "../services/http"
import { getAllProducts, getStockLevel, type Product, type StockLevel } from "../services/product"

type ModalState =
    | { type: "create" }
    | { type: "edit"; product: Product }
    | { type: "adjust"; product: Product }
    | { type: "delete"; product: Product }

const levelStyles: Record<StockLevel, { badge: string; bar: string; text: string }> = {
    IN_STOCK: { badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", text: "text-emerald-600" },
    LOW_STOCK: { badge: "bg-amber-50 text-amber-700", bar: "bg-amber-500", text: "text-amber-600" },
    OUT_OF_STOCK: { badge: "bg-rose-50 text-rose-700", bar: "bg-rose-500", text: "text-rose-600" },
}

const BAR_MAX_QUANTITY = 100

export default function Stock() {
    const { t } = useLanguage()
    const [search, setSearch] = useState("")
    const [levelFilter, setLevelFilter] = useState<StockLevel | "ALL">("ALL")

    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [reloadKey, setReloadKey] = useState(0)
    const [modal, setModal] = useState<ModalState | null>(null)
    // Managing products is admin-only; staff can only look at the stock.
    const isAdmin = isAdminUser()

    useEffect(() => {
        let isCancelled = false

        async function fetchProducts() {
            try {
                const data = await getAllProducts()
                if (isCancelled) return

                setProducts(
                    [...data].sort((a, b) =>
                        a.productCode.localeCompare(b.productCode, undefined, {
                            numeric: true,
                        })
                    )
                )
                setError("")
            } catch (err) {
                if (!isCancelled) setError(getErrorMessage(err))
            } finally {
                if (!isCancelled) setIsLoading(false)
            }
        }

        fetchProducts()

        return () => {
            isCancelled = true
        }
    }, [reloadKey])

    const reload = () => setReloadKey((key) => key + 1)
    const closeModal = () => setModal(null)

    if (isLoading) {
        return <p className="p-6">{t.stock.loading}</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    const countByLevel = (level: StockLevel) =>
        products.filter((p) => getStockLevel(p.quantity) === level).length

    const stats = [
        { level: "IN_STOCK" },
        { level: "LOW_STOCK" },
        { level: "OUT_OF_STOCK" },
    ] as const

    const keyword = search.trim().toLowerCase()
    const visibleProducts = products.filter((p) => {
        if (levelFilter !== "ALL" && getStockLevel(p.quantity) !== levelFilter) return false
        if (!keyword) return true
        return (
            p.name.toLowerCase().includes(keyword) ||
            p.productCode.toLowerCase().includes(keyword)
        )
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-emerald-50">
                        {t.stock.totalProducts}
                    </p>
                    <p className="mt-4 text-4xl font-semibold">{products.length}</p>
                </div>

                {stats.map(({ level }) => (
                    <div
                        key={level}
                        className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm"
                    >
                        <p className="text-lg font-medium text-slate-700">
                            {t.stock.level[level]}
                        </p>
                        <p className={`mt-4 text-4xl font-semibold ${levelStyles[level].text}`}>
                            {countByLevel(level)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="search"
                    placeholder={t.stock.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />

                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as StockLevel | "ALL")}
                    className="h-12 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                >
                    <option value="ALL">{t.stock.allLevels}</option>
                    <option value="IN_STOCK">{t.stock.level.IN_STOCK}</option>
                    <option value="LOW_STOCK">{t.stock.level.LOW_STOCK}</option>
                    <option value="OUT_OF_STOCK">{t.stock.level.OUT_OF_STOCK}</option>
                </select>

                {isAdmin && (
                    <button
                        type="button"
                        className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800"
                        onClick={() => setModal({ type: "create" })}
                    >
                        {t.stock.addProduct}
                    </button>
                )}
            </div>

            {visibleProducts.length === 0 ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    {t.stock.noMatch}
                </p>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                    <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <th className="px-5 py-4 font-medium">{t.stock.product}</th>
                                <th className="hidden px-5 py-4 font-medium md:table-cell">{t.stock.code}</th>
                                <th className="hidden px-5 py-4 font-medium sm:table-cell">{t.stock.price}</th>
                                <th className="px-5 py-4 font-medium">{t.stock.stock}</th>
                                {isAdmin && (
                                    <th className="px-5 py-4 text-right font-medium">{t.stock.actions}</th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {visibleProducts.map((product) => {
                                const level = getStockLevel(product.quantity)
                                const style = levelStyles[level]
                                const fill = Math.min(100, (product.quantity / BAR_MAX_QUANTITY) * 100)

                                return (
                                    <tr key={product.productCode} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">{product.name}</p>
                                            <p className="mt-0.5 text-xs text-slate-400 md:hidden">
                                                {product.productCode}
                                            </p>
                                        </td>

                                        <td className="hidden px-5 py-4 text-slate-500 md:table-cell">
                                            {product.productCode}
                                        </td>

                                        <td className="hidden px-5 py-4 font-medium text-amber-600 sm:table-cell">
                                            {formatPrice(product.price)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-slate-100 lg:block">
                                                    <div
                                                        className={`h-full rounded-full ${style.bar}`}
                                                        style={{ width: `${fill}%` }}
                                                    />
                                                </div>

                                                <span className="w-16 font-medium text-slate-900">
                                                    {product.quantity} {t.stock.units}
                                                </span>

                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}>
                                                    {t.stock.level[level]}
                                                </span>
                                            </div>
                                        </td>

                                        {isAdmin && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-4 text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        className="text-emerald-700 hover:underline"
                                                        onClick={() => setModal({ type: "adjust", product })}
                                                    >
                                                        {t.stock.adjust}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-slate-500 hover:underline"
                                                        onClick={() => setModal({ type: "edit", product })}
                                                    >
                                                        {t.stock.edit}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-rose-600 hover:underline"
                                                        onClick={() => setModal({ type: "delete", product })}
                                                    >
                                                        {t.stock.delete}
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === "create" && (
                <ProductFormModal onClose={closeModal} onSaved={reload} />
            )}

            {modal?.type === "edit" && (
                <ProductFormModal
                    product={modal.product}
                    onClose={closeModal}
                    onSaved={reload}
                />
            )}

            {modal?.type === "adjust" && (
                <AdjustStockModal
                    product={modal.product}
                    onClose={closeModal}
                    onSaved={reload}
                />
            )}

            {modal?.type === "delete" && (
                <DeleteProductModal
                    product={modal.product}
                    onClose={closeModal}
                    onDeleted={reload}
                />
            )}
        </div>
    )
}
