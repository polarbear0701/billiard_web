import { useState, type FormEvent } from "react"
import {
    createProduct,
    updateProductName,
    updateProductPrice,
    type Product,
} from "../services/product"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./formStyles"

interface ProductFormModalProps {
    // Omit to create a new product; pass one to edit its name and price.
    product?: Product
    onClose: () => void
    onSaved: () => void
}

export default function ProductFormModal({
    product,
    onClose,
    onSaved,
}: ProductFormModalProps) {
    const { t } = useLanguage()

    return (
        <Modal
            title={product ? t.stock.form.editTitle : t.stock.form.createTitle}
            onClose={onClose}
        >
            {(close) => (
                <ProductForm product={product} close={close} onSaved={onSaved} />
            )}
        </Modal>
    )
}

function ProductForm({
    product,
    close,
    onSaved,
}: {
    product?: Product
    close: () => void
    onSaved: () => void
}) {
    const { t } = useLanguage()
    const [name, setName] = useState(product?.name ?? "")
    const [price, setPrice] = useState(product ? String(product.price) : "")
    const [quantity, setQuantity] = useState("0")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const trimmedName = name.trim()
    const priceValue = Number(price)
    const quantityValue = Number(quantity)
    const isValid =
        trimmedName !== "" &&
        price !== "" &&
        priceValue > 0 &&
        (product !== undefined ||
            (quantity !== "" && Number.isInteger(quantityValue) && quantityValue >= 0))

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!isValid) return

        setIsSaving(true)
        setError("")
        try {
            if (product) {
                if (trimmedName !== product.name) {
                    await updateProductName(product.productCode, trimmedName)
                }
                if (priceValue !== product.price) {
                    await updateProductPrice(product.productCode, Math.round(priceValue))
                }
            } else {
                await createProduct({
                    name: trimmedName,
                    price: priceValue,
                    quantity: quantityValue,
                })
            }
            onSaved()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <section className="mt-6">
                <label htmlFor="product-name" className="text-sm font-semibold text-slate-900">
                    {t.stock.form.name}
                </label>
                <input
                    id="product-name"
                    type="text"
                    autoFocus
                    placeholder={t.stock.form.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                />
            </section>

            <section className="mt-6">
                <label htmlFor="product-price" className="text-sm font-semibold text-slate-900">
                    {t.stock.form.price}
                </label>
                <input
                    id="product-price"
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputClass}
                />
            </section>

            {!product && (
                <section className="mt-6">
                    <label htmlFor="product-quantity" className="text-sm font-semibold text-slate-900">
                        {t.stock.form.quantity}
                    </label>
                    <input
                        id="product-quantity"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputClass}
                    />
                </section>
            )}

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
                    ) : product ? (
                        t.stock.form.saveChanges
                    ) : (
                        t.stock.form.create
                    )}
                </button>
            </div>
        </form>
    )
}
