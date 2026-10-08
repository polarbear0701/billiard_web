import { useEffect, useState } from "react"
import { CreateTableModal, TableCard } from "../components"
import { formatTableCode, getAllTables, updateTablePrice, type Table, type TableStatus } from "../services/table"
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

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TableStatus | "ALL">("ALL")
    const [reloadKey, setReloadKey] = useState(0)
    const [isCreating, setIsCreating] = useState(false)
    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [priceInput, setPriceInput] = useState("")
    const [isSavingPrice, setIsSavingPrice] = useState(false)
    const [priceError, setPriceError] = useState("")

    useEffect(() => {
        let isCancelled = false

        async function fetchTables() {
            try {
                const data = await getAllTables()
                if (isCancelled) return

                const sortedTables = [...data].sort((a, b) =>
                    a.tableCode.localeCompare(b.tableCode, undefined, {
                        numeric: true,
                    })
                )
                setTables(sortedTables)
                setError("")
            } catch (err) {
                if (!isCancelled) setError(getErrorMessage(err))
            } finally {
                if (!isCancelled) setIsLoading(false)
            }
        }

        fetchTables()

        return () => {
            isCancelled = true
        }
    }, [reloadKey])

    function closeTableModal() {
        setSelectedTable(null)
        setIsEditingPrice(false)
        setPriceError("")
    }

    function startEditingPrice(table: Table) {
        setPriceInput(String(table.pricePerHour))
        setPriceError("")
        setIsEditingPrice(true)
    }

    async function savePrice(table: Table) {
        const newPrice = Number(priceInput)
        if (priceInput === "" || newPrice <= 0) {
            setPriceError("Enter a price greater than 0")
            return
        }

        setIsSavingPrice(true)
        setPriceError("")
        try {
            await updateTablePrice(table.tableCode, newPrice)
            const updated = { ...table, pricePerHour: newPrice }
            setTables((prev) =>
                prev.map((t) => (t.tableCode === table.tableCode ? updated : t))
            )
            setSelectedTable(updated)
            setIsEditingPrice(false)
        } catch (err) {
            setPriceError(getErrorMessage(err))
        } finally {
            setIsSavingPrice(false)
        }
    }

    if (isLoading) {
        return <p className="p-6">Loading tables...</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    const countByStatus = (status: TableStatus) =>
        tables.filter((t) => t.tableStatus === status).length

    const stats = [
        { label: "Available", value: countByStatus("AVAILABLE"), color: "text-emerald-600" },
        { label: "Occupied", value: countByStatus("OCCUPIED"), color: "text-rose-600" },
        { label: "Maintenance", value: countByStatus("MAINTENANCE"), color: "text-orange-600" },
    ]

    const keyword = search.trim().toLowerCase()
    const visibleTables = tables.filter((t) => {
        if (statusFilter !== "ALL" && t.tableStatus !== statusFilter) return false
        if (!keyword) return true
        return [
            t.tableCode,
            formatTableCode(t.tableCode),
            tableTypeLabels[t.tableType] ?? t.tableType,
        ].some((text) => text.toLowerCase().includes(keyword))
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-emerald-50">Total tables</p>
                    <p className="mt-4 text-4xl font-semibold">{tables.length}</p>
                </div>

                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm"
                    >
                        <p className="text-lg font-medium text-slate-700">{stat.label}</p>
                        <p className={`mt-4 text-4xl font-semibold ${stat.color}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="search"
                    placeholder="Search by table or type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TableStatus | "ALL")}
                    className="h-12 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                >
                    <option value="ALL">All statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                </select>

                <button
                    type="button"
                    className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800"
                    onClick={() => setIsCreating(true)}
                >
                    Add table
                </button>
            </div>

            {visibleTables.length === 0 ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    No tables match your filters.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {visibleTables.map((table) => (
                        <TableCard
                            key={table.tableCode}
                            tableObject={table}
                            onClick={() => setSelectedTable(table)}
                        />
                    ))}
                </div>
            )}

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
                                onClick={closeTableModal}
                            >
                                ×
                            </button>
                        </div>

                        <section className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Table
                            </h3>

                            <div className="mt-3 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-semibold text-slate-900">
                                        {formatTableCode(selectedTable.tableCode)}
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

                                <div className="py-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-sm text-slate-500">
                                            Rate per hour
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
                                                    className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                                />
                                                <button
                                                    type="button"
                                                    className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
                                                    disabled={isSavingPrice}
                                                    onClick={() => savePrice(selectedTable)}
                                                >
                                                    {isSavingPrice ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200"
                                                    disabled={isSavingPrice}
                                                    onClick={() => {
                                                        setIsEditingPrice(false)
                                                        setPriceError("")
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </dd>
                                        ) : (
                                            <dd className="flex items-center gap-3">
                                                <span className="text-base font-semibold text-amber-600">
                                                    {formatPrice(selectedTable.pricePerHour)}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="text-sm font-medium text-emerald-700 hover:underline"
                                                    onClick={() => startEditingPrice(selectedTable)}
                                                >
                                                    Edit
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
                            Note: Billing starts as soon as the session begins.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
                                onClick={closeTableModal}
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
                        <button type="button" onClick={closeTableModal}>
                            close
                        </button>
                    </form>
                </dialog>
            )}

            {isCreating && (
                <CreateTableModal
                    onClose={() => setIsCreating(false)}
                    onCreated={() => {
                        setIsCreating(false)
                        setReloadKey((key) => key + 1)
                    }}
                />
            )}
        </div>
    )
}