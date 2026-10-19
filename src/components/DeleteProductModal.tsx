import { deleteProduct, type Product } from "../services/product"
import { useLanguage } from "../i18n/useLanguage"
import ConfirmModal from "./ConfirmModal"

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
        <ConfirmModal
            title={t.stock.deleteModal.title}
            message={t.stock.deleteModal.message.replace("{name}", product.name)}
            confirmLabel={t.stock.deleteModal.confirm}
            onConfirm={() => deleteProduct(product.productCode)}
            onClose={onClose}
            onDone={onDeleted}
        />
    )
}
