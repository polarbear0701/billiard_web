import { useState } from "react"
import { formatTableCode, updateTablePrice, type Table } from "../services/table"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"
import { formatPrice, statusStyles } from "./statusStyles"

interface SessionModalProps {
    table: Table
    onClose: () => void
    onPriceUpdated: (updated: Table) => void
}

export default function SessionModal({
    table,
    onClose,
    onPriceUpdated,
}: SessionModalProps) {
    const { t } = useLanguage()
    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [priceInput, setPriceInput] = useState("")
    const [isSavingPrice, setIsSavingPrice] = useState(false)
    const [priceError, setPriceError] = useState("")

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
        <Modal title={t.session.title} onClose={onClose}>
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

                    <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {t.session.note}
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
                            onClick={close}
                        >
                            {t.common.cancel}
                        </button>

                        <button
                            type="button"
                            className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800"
                        >
                            {t.session.start}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    )
}
