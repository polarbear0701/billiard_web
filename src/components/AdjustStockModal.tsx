import { useState, type FormEvent } from "react"
import {
    adjustProductQuantity,
    clearProductStock,
    type Product,
} from "../services/product"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import {
    inputClass,
    optionClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "./formStyles"

interface AdjustStockModalProps {
    product: Product
    onClose: () => void
    onSaved: () => void
}

export default function AdjustStockModal({
    product,
    onClose,
    onSaved,
}: AdjustStockModalProps) {
    const { t } = useLanguage()

    return (
        <Modal title={t.stock.adjustModal.title} onClose={onClose}>
            {(close) => (
                <AdjustForm product={product} close={close} onSaved={onSaved} />
            )}
        </Modal>
    )
}

function AdjustForm({
    product,
    close,
    onSaved,
}: {
    product: Product
    close: () => void
    onSaved: () => void
}) {
    const { t } = useLanguage()
    const [decrement, setDecrement] = useState(false)
    const [amount, setAmount] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const amountValue = Number(amount)
    const hasAmount = amount !== "" && Number.isInteger(amountValue) && amountValue > 0
    const exceedsStock = decrement && amountValue > product.quantity
    const isValid = hasAmount && !exceedsStock
    const newStock = hasAmount
        ? product.quantity + (decrement ? -amountValue : amountValue)
        : product.quantity

    async function run(action: () => Promise<void>) {
        setIsSaving(true)
        setError("")
        try {
            await action()
            onSaved()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsSaving(false)
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!isValid) return
        run(() => adjustProductQuantity(product.productCode, amountValue, decrement))
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900">
                        {product.name}
                    </p>
                    <p className="text-sm text-slate-500">{product.productCode}</p>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-500">{t.stock.adjustModal.currentStock}</p>
                    <p className="text-lg font-semibold text-slate-900">
                        {product.quantity} {t.stock.units}
                    </p>
                </div>
            </div>

            <section className="mt-6 grid grid-cols-2 gap-3">
                <label className={optionClass(!decrement)}>
                    <input
                        type="radio"
                        name="direction"
                        className="sr-only"
                        checked={!decrement}
                        onChange={() => setDecrement(false)}
                    />
                    {t.stock.adjustModal.add}
                </label>
                <label className={optionClass(decrement)}>
                    <input
                        type="radio"
                        name="direction"
                        className="sr-only"
                        checked={decrement}
                        onChange={() => setDecrement(true)}
                    />
                    {t.stock.adjustModal.remove}
                </label>
            </section>

            <section className="mt-6">
                <label htmlFor="adjust-amount" className="text-sm font-semibold text-slate-900">
                    {t.stock.adjustModal.amount}
                </label>
                <input
                    id="adjust-amount"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClass}
                />
                {exceedsStock && (
                    <p className="mt-2 text-sm text-rose-600">
                        {t.stock.adjustModal.tooMany}
                    </p>
                )}
            </section>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <span>{t.stock.adjustModal.newStock}</span>
                <span className="font-semibold">
                    {exceedsStock ? "—" : `${newStock} ${t.stock.units}`}
                </span>
            </div>

            {error && (
                <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={close}
                    disabled={isSaving}
                >
                    {t.common.cancel}
                </button>

                <button
                    type="submit"
                    className={primaryButtonClass}
                    disabled={!isValid || isSaving}
                >
                    {isSaving ? (
                        <span className="loading loading-dots loading-sm" />
                    ) : (
                        t.stock.adjustModal.apply
                    )}
                </button>
            </div>

            <button
                type="button"
                className="mt-4 w-full text-center text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
                disabled={isSaving || product.quantity === 0}
                onClick={() => run(() => clearProductStock(product.productCode))}
            >
                {t.stock.adjustModal.clear}
            </button>
        </form>
    )
}
