import { formatTableCode, type Table, type TableStatus } from "../services/table"

interface TableCardProps {
    tableObject: Table
    onClick: () => void
}

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

export default function TableCard({
    tableObject,
    onClick,
}: TableCardProps) {
    const statusStyle = statusStyles[tableObject.tableStatus]

    const formattedPrice = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(tableObject.pricePerHour)

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full flex-col gap-6 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                        {formatTableCode(tableObject.tableCode)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {tableTypeLabels[tableObject.tableType] ??
                            tableObject.tableType}
                    </p>
                </div>

                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}>
                    {tableObject.tableStatus}
                </span>
            </div>

            <p className="text-lg font-semibold text-amber-600">
                {formattedPrice}
                <span className="text-sm font-normal text-slate-400"> / hour</span>
            </p>
        </button>
    )
}
