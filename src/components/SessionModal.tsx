import { useEffect, useState } from "react"
import { formatTableCode, setTableStatus, updateTablePrice, type Table } from "../services/table"
import { isAdminUser } from "../services/auth"
import {
    adjustPlaySessionStartTime,
    getCurrentFee,
    getCurrentPlaySession,
    startPlaySession,
    type PlaySession,
} from "../services/playSession"
import { createInvoice, type Invoice } from "../services/invoice"
import { getErrorMessage } from "../services/http"
import { formatDateTime, shiftServerTime } from "../i18n/formatDateTime"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import SessionMenu from "./SessionMenu"
import { formatPrice, statusStyles } from "./statusStyles"

interface SessionModalProps {
    table: Table
    onClose: () => void
    onPriceUpdated: (updated: Table) => void
    onSessionChanged: () => void
    onCheckedOut: (invoice: Invoice) => void
    onDeleteRequested: (table: Table) => void
}

const FEE_REFRESH_MS = 30_000
// Minutes the start time can be moved by; negative means earlier.
const START_TIME_SHIFTS = [-30, -15, -10, -5, 5]

export default function SessionModal({
    table,
    onClose,
    onPriceUpdated,
    onSessionChanged,
    onCheckedOut,
    onDeleteRequested,
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
    const [isAdjustingStart, setIsAdjustingStart] = useState(false)
    const [isSavingStart, setIsSavingStart] = useState(false)
    const [startError, setStartError] = useState("")

    const isAdmin = isAdminUser()
    const [isChangingStatus, setIsChangingStatus] = useState(false)
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

    async function shiftStartTime(minutes: number) {
        if (!session) return

        const startTime = shiftServerTime(session.startTime, minutes)
        if (!startTime) return

        setIsSavingStart(true)
        setStartError("")
        try {
            await adjustPlaySessionStartTime(session.sessionCode, startTime)
            setSession({ ...session, startTime })
            // The fee depends on the start time, so refresh it right away.
            setFee(await getCurrentFee(session.sessionCode))
        } catch (err) {
            setStartError(getErrorMessage(err))
        } finally {
            setIsSavingStart(false)
        }
    }

    // AVAILABLE <-> MAINTENANCE; the server refuses anything involving an occupied table.
    async function toggleMaintenance(close: () => void) {
        setIsChangingStatus(true)
        setSessionError("")
        try {
            await setTableStatus(
                table.tableCode,
                table.tableStatus === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE"
            )
            onSessionChanged()
            close()
        } catch (err) {
            setSessionError(getErrorMessage(err))
            setIsChangingStatus(false)
        }
    }

    async function submitSession(close: () => void) {
        setIsSubmitting(true)
        setSessionError("")
        try {
            if (isOccupied) {
                const sessionCode =
                    session?.sessionCode ??
                    (await getCurrentPlaySession(table.tableCode)).sessionCode

                // Creating the invoice also closes the session on the server.
                const invoice = await createInvoice(sessionCode)
                onSessionChanged()
                onCheckedOut(invoice)
            } else {
                await startPlaySession(table.tableCode)
                onSessionChanged()
            }
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
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className="text-sm font-medium text-emerald-700 hover:underline"
                                                    onClick={startEditingPrice}
                                            >
                                                    {t.session.edit}
                                                </button>
                                            )}
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
                                    <dd className="flex items-center gap-3 text-sm font-medium text-slate-900">
                                        {session ? formatDateTime(session.startTime, language) : "—"}
                                        {session && (
                                            <button
                                                type="button"
                                                className="font-medium text-emerald-700 hover:underline"
                                                onClick={() => setIsAdjustingStart((open) => !open)}
                                            >
                                                {t.session.adjustStart}
                                            </button>
                                        )}
                                    </dd>
                                </div>

                                {isAdjustingStart && (
                                    <div className="py-3">
                                        <p className="text-xs text-slate-500">{t.session.adjustStartHint}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {START_TIME_SHIFTS.map((minutes) => (
                                                <button
                                                    key={minutes}
                                                    type="button"
                                                    disabled={isSavingStart}
                                                    onClick={() => shiftStartTime(minutes)}
                                                    className="h-10 rounded-full bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                                                >
                                                    {minutes < 0 ? "−" : "+"}
                                                    {t.session.minutes.replace("{n}", String(Math.abs(minutes)))}
                                                </button>
                                            ))}
                                        </div>
                                        {startError && (
                                            <p className="mt-2 text-sm text-rose-600">{startError}</p>
                                        )}
                                    </div>
                                )}

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

                    {!isOccupied && (
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm font-medium">
                            <button
                                type="button"
                                className="text-slate-600 hover:underline disabled:opacity-50"
                                disabled={isChangingStatus || isSubmitting}
                                onClick={() => toggleMaintenance(close)}
                            >
                                {table.tableStatus === "MAINTENANCE"
                                    ? t.tables.endMaintenance
                                    : t.tables.setMaintenance}
                            </button>

                            {isAdmin && (
                                <button
                                    type="button"
                                    className="text-rose-600 hover:underline"
                                    onClick={() => {
                                        onDeleteRequested(table)
                                        close()
                                    }}
                                >
                                    {t.tables.deleteTable}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </Modal>
    )
}
