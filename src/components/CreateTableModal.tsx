import { useState, type FormEvent } from "react"
import { createTable, type TableStatus, type TableType } from "../services/table"
import { getErrorMessage } from "../services/http"

interface CreateTableModalProps {
    onClose: () => void
    onCreated: () => void
}

const typeOptions: { value: TableType; label: string }[] = [
    { value: "POOL", label: "Pool" },
    { value: "CAROM", label: "Carom" },
    { value: "LIBRE", label: "Libre" },
]

const statusOptions: { value: TableStatus; label: string }[] = [
    { value: "AVAILABLE", label: "Available" },
    { value: "MAINTENANCE", label: "Maintenance" },
]

export default function CreateTableModal({
    onClose,
    onCreated,
}: CreateTableModalProps) {
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
        } catch (err) {
            setError(getErrorMessage(err))
            setIsSaving(false)
        }
    }

    return (
        <dialog className="modal modal-open bg-slate-900/50 backdrop-blur-[2px]">
            <form
                onSubmit={handleSubmit}
                className="modal-box max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Add Table
                    </h2>

                    <button
                        type="button"
                        aria-label="Close"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <section className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">Table type</h3>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        {typeOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                                    tableType === option.value
                                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="tableType"
                                    className="sr-only"
                                    checked={tableType === option.value}
                                    onChange={() => setTableType(option.value)}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </section>

                <section className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">Initial status</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        {statusOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                                    tableStatus === option.value
                                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="tableStatus"
                                    className="sr-only"
                                    checked={tableStatus === option.value}
                                    onChange={() => setTableStatus(option.value)}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </section>

                <section className="mt-6">
                    <label
                        htmlFor="create-price"
                        className="text-sm font-semibold text-slate-900"
                    >
                        Price per hour (VND)
                    </label>
                    <input
                        id="create-price"
                        type="number"
                        min={0}
                        step={1000}
                        inputMode="numeric"
                        placeholder="e.g. 60000"
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
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                        disabled={!isValid || isSaving}
                    >
                        {isSaving ? (
                            <span className="loading loading-dots loading-sm" />
                        ) : (
                            "Create table"
                        )}
                    </button>
                </div>
            </form>

            <div className="modal-backdrop">
                <button type="button" onClick={onClose}>
                    close
                </button>
            </div>
        </dialog>
    )
}
