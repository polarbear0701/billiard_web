import { useState } from "react"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import { dangerButtonClass, secondaryButtonClass } from "./formStyles"

interface ConfirmModalProps {
    title: string
    message: string
    confirmLabel: string
    // The action to perform; a thrown error is shown inside the modal.
    onConfirm: () => Promise<void>
    onClose: () => void
    // Called after the action succeeded, before the modal closes.
    onDone: () => void
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel,
    onConfirm,
    onClose,
    onDone,
}: ConfirmModalProps) {
    return (
        <Modal title={title} onClose={onClose} maxWidth="max-w-md">
            {(close) => (
                <ConfirmBody
                    message={message}
                    confirmLabel={confirmLabel}
                    onConfirm={onConfirm}
                    onDone={onDone}
                    close={close}
                />
            )}
        </Modal>
    )
}

function ConfirmBody({
    message,
    confirmLabel,
    onConfirm,
    onDone,
    close,
}: Pick<ConfirmModalProps, "message" | "confirmLabel" | "onConfirm" | "onDone"> & {
    close: () => void
}) {
    const { t } = useLanguage()
    const [isWorking, setIsWorking] = useState(false)
    const [error, setError] = useState("")

    async function handleConfirm() {
        setIsWorking(true)
        setError("")
        try {
            await onConfirm()
            onDone()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsWorking(false)
        }
    }

    return (
        <>
            <p className="mt-6 text-sm text-slate-600">{message}</p>

            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
                <button type="button" className={secondaryButtonClass} onClick={close} disabled={isWorking}>
                    {t.common.cancel}
                </button>

                <button type="button" className={dangerButtonClass} onClick={handleConfirm} disabled={isWorking}>
                    {isWorking ? <span className="loading loading-dots loading-sm" /> : confirmLabel}
                </button>
            </div>
        </>
    )
}
