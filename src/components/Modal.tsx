import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useLanguage } from "../i18n/useLanguage"

const EXIT_DURATION_MS = 200

interface ModalProps {
    title: string
    // Called once the exit animation has finished; unmount the modal here.
    onClose: () => void
    maxWidth?: string
    // Receives `close`, which plays the exit animation before calling onClose.
    children: (close: () => void) => ReactNode
}

export default function Modal({
    title,
    onClose,
    maxWidth = "max-w-lg",
    children,
}: ModalProps) {
    const { t } = useLanguage()
    const [isClosing, setIsClosing] = useState(false)
    const onCloseRef = useRef(onClose)

    useEffect(() => {
        onCloseRef.current = onClose
    })

    const close = useCallback(() => setIsClosing(true), [])

    useEffect(() => {
        if (!isClosing) return

        const timer = window.setTimeout(
            () => onCloseRef.current(),
            EXIT_DURATION_MS
        )
        return () => window.clearTimeout(timer)
    }, [isClosing])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") close()
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [close])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div
                className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] motion-reduce:animate-none ${
                    isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
                }`}
                onClick={close}
            />

            <div
                className={`relative max-h-[calc(100vh-2rem)] w-full ${maxWidth} overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl motion-reduce:animate-none sm:p-8 ${
                    isClosing ? "animate-modal-out" : "animate-modal-in"
                }`}
            >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {title}
                    </h2>

                    <button
                        type="button"
                        aria-label={t.common.close}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={close}
                    >
                        ×
                    </button>
                </div>

                {children(close)}
            </div>
        </div>
    )
}
