import { useEffect, useState } from "react"
import { CreateTableModal, SessionModal, TableCard } from "../components"
import { formatTableCode, getAllTables, type Table, type TableStatus } from "../services/table"
import { getErrorMessage } from "../services/http"
import { useLanguage } from "../i18n/useLanguage"

export default function Tables() {
    const { t } = useLanguage()
    const [tables, setTables] = useState<Table[]>([])
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TableStatus | "ALL">("ALL")
    const [reloadKey, setReloadKey] = useState(0)
    const [isCreating, setIsCreating] = useState(false)

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

    function handlePriceUpdated(updated: Table) {
        setTables((prev) =>
            prev.map((table) =>
                table.tableCode === updated.tableCode ? updated : table
            )
        )
        setSelectedTable(updated)
    }

    if (isLoading) {
        return <p className="p-6">{t.tables.loading}</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    const countByStatus = (status: TableStatus) =>
        tables.filter((table) => table.tableStatus === status).length

    const stats = [
        { status: "AVAILABLE", color: "text-emerald-600" },
        { status: "OCCUPIED", color: "text-rose-600" },
        { status: "MAINTENANCE", color: "text-orange-600" },
    ] as const

    const keyword = search.trim().toLowerCase()
    const visibleTables = tables.filter((table) => {
        if (statusFilter !== "ALL" && table.tableStatus !== statusFilter) return false
        if (!keyword) return true
        return [
            table.tableCode,
            formatTableCode(table.tableCode, t.tables.tableLabel),
            t.type[table.tableType as keyof typeof t.type] ?? table.tableType,
        ].some((text) => text.toLowerCase().includes(keyword))
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-emerald-50">
                        {t.tables.totalTables}
                    </p>
                    <p className="mt-4 text-4xl font-semibold">{tables.length}</p>
                </div>

                {stats.map((stat) => (
                    <div
                        key={stat.status}
                        className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm"
                    >
                        <p className="text-lg font-medium text-slate-700">
                            {t.status[stat.status]}
                        </p>
                        <p className={`mt-4 text-4xl font-semibold ${stat.color}`}>
                            {countByStatus(stat.status)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="search"
                    placeholder={t.tables.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TableStatus | "ALL")}
                    className="h-12 rounded-xl border-none bg-white px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                >
                    <option value="ALL">{t.tables.allStatuses}</option>
                    <option value="AVAILABLE">{t.status.AVAILABLE}</option>
                    <option value="OCCUPIED">{t.status.OCCUPIED}</option>
                    <option value="MAINTENANCE">{t.status.MAINTENANCE}</option>
                </select>

                <button
                    type="button"
                    className="btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800"
                    onClick={() => setIsCreating(true)}
                >
                    {t.tables.addTable}
                </button>
            </div>

            {visibleTables.length === 0 ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    {t.tables.noMatch}
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
                <SessionModal
                    table={selectedTable}
                    onClose={() => setSelectedTable(null)}
                    onPriceUpdated={handlePriceUpdated}
                />
            )}

            {isCreating && (
                <CreateTableModal
                    onClose={() => setIsCreating(false)}
                    onCreated={() => setReloadKey((key) => key + 1)}
                />
            )}
        </div>
    )
}
