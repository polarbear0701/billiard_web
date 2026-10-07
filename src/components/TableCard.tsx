import { type Table, type TableStatus } from "../services/table"

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

export default function TableCard(tableObject: Table) {
    const statusStyle = statusStyles[tableObject.tableStatus]
    const formattedPrice = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(tableObject.pricePerHour)

    return (
        <article className="flex aspect-[1.55] w-full max-w-sm flex-col rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                    🎱
                </div>

                <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}>
                    {tableObject.tableStatus}
                </span>
            </div>

            <div className="mt-auto flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        {tableObject.tableCode}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {tableTypeLabels[tableObject.tableType] ?? tableObject.tableType}
                    </p>
                </div>

                <p className="text-lg font-semibold text-orange-700">
                    {formattedPrice}
                </p>
            </div>
        </article>
    )
}