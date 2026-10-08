import { useEffect, useState } from "react"
import { TableCard } from "../components"
import { getAllTables, type Table, type TableStatus } from "../services/table"
import { getErrorMessage } from "../services/http"

const statusStyles: Record<TableStatus, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700",
    OCCUPIED: "bg-rose-50 text-rose-700",
    MAINTENANCE: "bg-orange-50 text-orange-700",
}

const tableTypeLabels: Record<string, string> = {
    POOL: "Pool",
    CAROM: "Carom",
    LIBRE: "Libre",
}

function formatPrice(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value)
}

export default function Tables() {
    const [tables, setTables] = useState<Table[]>([])
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchTables() {
            try {
                const data = await getAllTables()
                const sortedTables = [...data].sort((a, b) =>
                    a.tableCode.localeCompare(b.tableCode, undefined, {
                        numeric: true,
                    })
                )
                setTables(sortedTables)
            } catch (err) {
                setError(getErrorMessage(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchTables()
    }, [])

    if (isLoading) {
        return <p className="p-6">Loading tables...</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                    <TableCard
                        key={table.tableCode}
                        tableObject={table}
                        onClick={() => setSelectedTable(table)}
                    />
                ))}
            </div>

            {selectedTable && (
                <dialog className="modal modal-open bg-slate-900/50 backdrop-blur-[2px]">
                    <div className="modal-box max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Start Session
                            </h2>

                            <button
                                type="button"
                                aria-label="Close"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => setSelectedTable(null)}
                            >
                                ×
                            </button>
                        </div>

                        <section className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Table
                            </h3>

                            <div className="mt-3 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-3xl">
                                    🎱
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-semibold text-slate-900">
                                        {selectedTable.tableCode}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {tableTypeLabels[selectedTable.tableType] ??
                                            selectedTable.tableType}{" "}
                                        table
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[selectedTable.tableStatus]}`}
                                >
                                    {selectedTable.tableStatus}
                                </span>
                            </div>
                        </section>

                        <section className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Pricing
                            </h3>

                            <dl className="mt-3 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4">
                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-sm text-slate-500">
                                        Table type
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900">
                                        {tableTypeLabels[selectedTable.tableType] ??
                                            selectedTable.tableType}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-sm text-slate-500">
                                        Rate per hour
                                    </dt>
                                    <dd className="text-base font-semibold text-amber-600">
                                        {formatPrice(selectedTable.pricePerHour)}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Note: Billing starts as soon as the session begins.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
                                onClick={() => setSelectedTable(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800"
                            >
                                Start session
                            </button>
                        </div>
                    </div>

                    <form method="dialog" className="modal-backdrop">
                        <button type="button" onClick={() => setSelectedTable(null)}>
                            close
                        </button>
                    </form>
                </dialog>
            )}
        </div>
    )
}