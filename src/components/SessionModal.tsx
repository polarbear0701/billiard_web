import { useEffect, useState } from "react"
import { formatTableCode, updateTablePrice, type Table } from "../services/table"
import {
    closePlaySession,
    getCurrentFee,
    getCurrentPlaySession,
    startPlaySession,
    type PlaySession,
} from "../services/playSession"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import SessionMenu from "./SessionMenu"
import { formatPrice, statusStyles } from "./statusStyles"

interface SessionModalProps {
    table: Table
    onClose: () => void
    onPriceUpdated: (updated: Table) => void
    onSessionChanged: () => void
}

const FEE_REFRESH_MS = 30_000

// Server timestamps carry nanoseconds and no timezone; keep milliseconds so Date can parse them.
function formatStartTime(value: string, language: string) {
    const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"))
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString(language === "vi" ? "vi-VN" : "en-GB", {
        dateStyle: "short",
        timeStyle: "short",
    })
}

export default function SessionModal({
    table,
    onClose,
    onPriceUpdated,
    onSessionChanged,
}: SessionModalProps) {
    const { t, language } = useLanguage()
    const [session, setSession] = useState<PlaySession | null>(null)
    const [fee, setFee] = useState<number | null>(null)
    const [feeError, setFeeError] = useState("")
    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [priceInput, setPriceInput] = useState("")
    const [isSavingPrice, setIsSavingPrice] = useState(false)
    const [priceError, setPriceError] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sessionError, setSessionError] = useState("")

    const isOccupied = table.tableStatus === "OCCUPIED"
    const canSubmit = table.tableStatus === "AVAILABLE" || isOccupied
    useEffect(() => {
        if (!isOccupied) return

        let isCancelled = false
        let timer: number | undefined

        async function loadFee(sessionCode: string) {
            try {
                const currentFee = await getCurrentFee(sessionCode)
                if (isCancelled) return
                setFee(currentFee)
                setFeeError("")
            } catch (err) {
                if (!isCancelled) setFeeError(getErrorMessage(err))
            }
        }

        async function loadSession() {
            try {
                const current = await getCurrentPlaySession(table.tableCode)
                if (isCancelled) return

                setSession(current)
                await loadFee(current.sessionCode)
                if (isCancelled) return

                timer = window.setInterval(
                    () => loadFee(current.sessionCode),
                    FEE_REFRESH_MS
                )
            } catch (err) {
                if (!isCancelled) setFeeError(getErrorMessage(err))
            }
        }

        loadSession()

        return () => {
            isCancelled = true
            window.clearInterval(timer)
        }
    }, [isOccupied, table.tableCode])

    const typeLabel = t.type[table.tableType as keyof typeof t.type] ?? table.tableType

    function startEditingPrice() {
        setPriceInput(String(table.pricePerHour))
        setPriceError("")
        setIsEditingPrice(true)
    }

    function cancelEditingPrice() {
        setIsEditingPrice(false)
        setPriceError("")
    }

    async function submitSession(close: () => void) {
        setIsSubmitting(true)
        setSessionError("")
        try {
            if (isOccupied) {
                const sessionCode =
                    session?.sessionCode ??
                    (await getCurrentPlaySession(table.tableCode)).sessionCode
                await closePlaySession(sessionCode)
            } else {
                await startPlaySession(table.tableCode)
            }
            onSessionChanged()
            close()
        } catch (err) {
            setSessionError(getErrorMessage(err))
            setIsSubmitting(false)
        }
    }

    async function savePrice() {
        const newPrice = Number(priceInput)
        if (priceInput === "" || newPrice <= 0) {
            setPriceError(t.session.priceInvalid)
            return
        }

        setIsSavingPrice(true)
        setPriceError("")
        try {
            await updateTablePrice(table.tableCode, newPrice)
            onPriceUpdated({ ...table, pricePerHour: newPrice })
            setIsEditingPrice(false)
        } catch (err) {
            setPriceError(getErrorMessage(err))
        } finally {
            setIsSavingPrice(false)
        }
    }

    return (
        <Modal
            title={isOccupied ? t.session.closeTitle : t.session.title}
            onClose={onClose}
        >
            {(close) => (
                <>
                    <section className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-900">
                            {t.session.tableSection}
                        </h3>

                        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-semibold text-slate-900">
                                    {formatTableCode(table.tableCode, t.tables.tableLabel)}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {t.session.tableOfType.replace("{type}", typeLabel)}
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[table.tableStatus]}`}
                            >
                                {t.status[table.tableStatus]}
                            </span>
                        </div>
                    </section>

                    <section className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-900">
                            {t.session.pricing}
                        </h3>

                        <dl className="mt-3 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4">
                            <div className="flex items-center justify-between py-3">
                                <dt className="text-sm text-slate-500">
                                    {t.session.tableType}
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {typeLabel}
                                </dd>
                            </div>

                            <div className="py-3">
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-sm text-slate-500">
                                        {t.session.ratePerHour}
                                    </dt>

                                    {isEditingPrice ? (
                                        <dd className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                step={1000}
                                                autoFocus
                                                value={priceInput}
                                                onChange={(e) => setPriceInput(e.target.value)}
                                                className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                            />
                                            <button
                                                type="button"
                                                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
                                                disabled={isSavingPrice}
                                                onClick={savePrice}
                                            >
                                                {isSavingPrice ? t.session.saving : t.session.save}
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200"
                                                disabled={isSavingPrice}
                                                onClick={cancelEditingPrice}
                                            >
                                                {t.common.cancel}
                                            </button>
                                        </dd>
                                    ) : (
                                        <dd className="flex items-center gap-3">
                                            <span className="text-base font-semibold text-amber-600">
                                                {formatPrice(table.pricePerHour)}
                                            </span>
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-emerald-700 hover:underline"
                                                onClick={startEditingPrice}
                                            >
                                                {t.session.edit}
                                            </button>
                                        </dd>
                                    )}
                                </div>

                                {priceError && (
                                    <p className="mt-2 text-right text-sm text-rose-600">
                                        {priceError}
                                    </p>
                                )}
                            </div>
                        </dl>
                    </section>

                    {isOccupied && (
                        <section className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {t.session.currentSession}
                            </h3>

                            <dl className="mt-3 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4">
                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-sm text-slate-500">
                                        {t.session.sessionCode}
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900">
                                        {session?.sessionCode ?? "—"}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-sm text-slate-500">
                                        {t.session.startedAt}
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900">
                                        {session ? formatStartTime(session.startTime, language) : "—"}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-sm text-slate-500">
                                        {t.session.currentFee}
                                    </dt>
                                    <dd className="text-base font-semibold text-amber-600">
                                        {fee === null ? "—" : formatPrice(fee)}
                                    </dd>
                                </div>
                            </dl>

                            {feeError && (
                                <p className="mt-2 text-sm text-rose-600">{feeError}</p>
                            )}
                        </section>
                    )}

                    {isOccupied && session && (
                        <SessionMenu sessionCode={session.sessionCode} />
                    )}

                    {!isOccupied && (
                        <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {t.session.note}
                        </p>
                    )}

                    {sessionError && (
                        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {sessionError}
                        </p>
                    )}

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
                            onClick={close}
                            disabled={isSubmitting}
                        >
                            {t.common.cancel}
                        </button>

                        <button
                            type="button"
                            className={`btn h-12 rounded-xl border-none text-white shadow-none disabled:bg-slate-200 disabled:text-slate-400 ${
                                isOccupied
                                    ? "bg-rose-600 hover:bg-rose-700"
                                    : "bg-emerald-700 hover:bg-emerald-800"
                            }`}
                            disabled={!canSubmit || isSubmitting}
                            onClick={() => submitSession(close)}
                        >
                            {isSubmitting ? (
                                <span className="loading loading-dots loading-sm" />
                            ) : isOccupied ? (
                                t.session.close
                            ) : (
                                t.session.start
                            )}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    )
}
