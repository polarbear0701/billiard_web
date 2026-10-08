import { useState } from "react"
import { deleteProduct, type Product } from "../services/product"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import { dangerButtonClass, secondaryButtonClass } from "./formStyles"

interface DeleteProductModalProps {
    product: Product
    onClose: () => void
    onDeleted: () => void
}

export default function DeleteProductModal({
    product,
    onClose,
    onDeleted,
}: DeleteProductModalProps) {
    const { t } = useLanguage()

    return (
        <Modal title={t.stock.deleteModal.title} onClose={onClose} maxWidth="max-w-md">
            {(close) => (
                <DeleteConfirm product={product} close={close} onDeleted={onDeleted} />
            )}
        </Modal>
    )
}

function DeleteConfirm({
    product,
    close,
    onDeleted,
}: {
    product: Product
    close: () => void
    onDeleted: () => void
}) {
    const { t } = useLanguage()
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState("")

    async function handleDelete() {
        setIsDeleting(true)
        setError("")
        try {
            await deleteProduct(product.productCode)
            onDeleted()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsDeleting(false)
        }
    }

    return (
        <>
            <p className="mt-6 text-sm text-slate-600">
                {t.stock.deleteModal.message.replace("{name}", product.name)}
            </p>

            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={close}
                    disabled={isDeleting}
                >
                    {t.common.cancel}
                </button>

                <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <span className="loading loading-dots loading-sm" />
                    ) : (
                        t.stock.deleteModal.confirm
                    )}
                </button>
            </div>
        </>
    )
}
