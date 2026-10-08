import { useLanguage } from "../i18n/useLanguage"
import { formatTableCode, type Table } from "../services/table"
import { formatPrice, statusStyles } from "./statusStyles"

interface TableCardProps {
    tableObject: Table
    onClick: () => void
}

export default function TableCard({
    tableObject,
    onClick,
}: TableCardProps) {
    const { t } = useLanguage()
    const statusStyle = statusStyles[tableObject.tableStatus]

    const formattedPrice = formatPrice(tableObject.pricePerHour)

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full flex-col gap-6 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                        {formatTableCode(tableObject.tableCode, t.tables.tableLabel)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {t.type[tableObject.tableType as keyof typeof t.type] ??
                            tableObject.tableType}
                    </p>
                </div>

                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}>
                    {t.status[tableObject.tableStatus]}
                </span>
            </div>

            <p className="text-lg font-semibold text-amber-600">
                {formattedPrice}
                <span className="text-sm font-normal text-slate-400"> {t.tables.perHour}</span>
            </p>
        </button>
    )
}
