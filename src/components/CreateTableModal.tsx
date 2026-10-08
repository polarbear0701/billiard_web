import { useState, type FormEvent } from "react"
import { createTable, type TableStatus, type TableType } from "../services/table"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"
import Modal from "./Modal"

interface CreateTableModalProps {
    onClose: () => void
    onCreated: () => void
}

const typeOptions: TableType[] = ["POOL", "CAROM", "LIBRE"]
const statusOptions: TableStatus[] = ["AVAILABLE", "MAINTENANCE"]

export default function CreateTableModal({
    onClose,
    onCreated,
}: CreateTableModalProps) {
    const { t } = useLanguage()

    return (
        <Modal title={t.create.title} onClose={onClose}>
            {(close) => <CreateTableForm close={close} onCreated={onCreated} />}
        </Modal>
    )
}

function CreateTableForm({
    close,
    onCreated,
}: {
    close: () => void
    onCreated: () => void
}) {
    const { t } = useLanguage()
    const [tableType, setTableType] = useState<TableType>("POOL")
    const [tableStatus, setTableStatus] = useState<TableStatus>("AVAILABLE")
    const [price, setPrice] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const priceValue = Number(price)
    const isValid = price !== "" && priceValue > 0

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!isValid) return

        setIsSaving(true)
        setError("")
        try {
            await createTable({ tableType, tableStatus, pricePerHour: priceValue })
            onCreated()
            close()
        } catch (err) {
            setError(getErrorMessage(err))
            setIsSaving(false)
        }
    }

    const optionClass = (selected: boolean) =>
        `cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
            selected
                ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`

    return (
        <form onSubmit={handleSubmit}>
            <section className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">
                    {t.create.tableType}
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-3">
                    {typeOptions.map((option) => (
                        <label key={option} className={optionClass(tableType === option)}>
                            <input
                                type="radio"
                                name="tableType"
                                className="sr-only"
                                checked={tableType === option}
                                onChange={() => setTableType(option)}
                            />
                            {t.type[option]}
                        </label>
                    ))}
                </div>
            </section>

            <section className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">
                    {t.create.initialStatus}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    {statusOptions.map((option) => (
                        <label key={option} className={optionClass(tableStatus === option)}>
                            <input
                                type="radio"
                                name="tableStatus"
                                className="sr-only"
                                checked={tableStatus === option}
                                onChange={() => setTableStatus(option)}
                            />
                            {t.status[option]}
                        </label>
                    ))}
                </div>
            </section>

            <section className="mt-6">
                <label
                    htmlFor="create-price"
                    className="text-sm font-semibold text-slate-900"
                >
                    {t.create.pricePerHour}
                </label>
                <input
                    id="create-price"
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    placeholder={t.create.pricePlaceholder}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
            </section>

            {error && (
                <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className="btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
                    onClick={close}
                    disabled={isSaving}
                >
                    {t.common.cancel}
                </button>

                <button
                    type="submit"
                    className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                    disabled={!isValid || isSaving}
                >
                    {isSaving ? (
                        <span className="loading loading-dots loading-sm" />
                    ) : (
                        t.create.submit
                    )}
                </button>
            </div>
        </form>
    )
}
