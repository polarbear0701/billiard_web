import { useState, type ReactNode } from "react"
import RevenueChart from "../components/RevenueChart"
import { formatPrice, statusStyles } from "../components/statusStyles"
import { useApi } from "../hooks/useApi"
import { useLanguage } from "../i18n/useLanguage"
import {
    getLowStock,
    getRevenueSeries,
    getSummary,
    getTableOverview,
    MAX_HOURLY_DAYS,
    getTopProducts,
    type DateRange,
    type Granularity,
    type TopProductsBy,
} from "../services/dashboard"
import { formatTableCode, type TableStatus } from "../services/table"

type Preset = "today" | "last7" | "last30" | "thisMonth" | "custom"

const presets: Preset[] = ["today", "last7", "last30", "thisMonth", "custom"]
const granularities: Granularity[] = ["HOUR", "DAY", "MONTH"]
const lowStockThresholds = [3, 5, 10, 20]

const pad = (n: number) => String(n).padStart(2, "0")
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

function rangeFor(preset: Exclude<Preset, "custom">): DateRange {
    const today = new Date()
    const start = new Date(today)

    if (preset === "last7") start.setDate(today.getDate() - 6)
    if (preset === "last30") start.setDate(today.getDate() - 29)
    if (preset === "thisMonth") start.setDate(1)

    return { from: toIsoDate(start), to: toIsoDate(today) }
}

function daysIn({ from, to }: DateRange) {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1
}

function defaultGranularity(range: DateRange): Granularity {
    const days = daysIn(range)
    return days <= 1 ? "HOUR" : days <= 92 ? "DAY" : "MONTH"
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {action}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    )
}

function Segmented<T extends string | number>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[]
    value: T
    onChange: (value: T) => void
}) {
    return (
        <div role="group" className="flex rounded-xl bg-slate-100 p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        value === option.value
                            ? "bg-white text-emerald-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

function Status({ isLoading, error, children }: { isLoading: boolean; error?: string; children: ReactNode }) {
    if (error) return <p className="text-sm text-rose-600">{error}</p>
    if (isLoading) return <p className="py-6 text-center"><span className="loading loading-dots loading-md text-slate-300" /></p>
    return <>{children}</>
}

export default function Dashboard() {
    const { t } = useLanguage()
    const [preset, setPreset] = useState<Preset>("today")
    const [customRange, setCustomRange] = useState<DateRange>(() => rangeFor("last7"))
    const [granularityChoice, setGranularityChoice] = useState<Granularity | null>(null)
    const [topBy, setTopBy] = useState<TopProductsBy>("REVENUE")
    const [lowStockThreshold, setLowStockThreshold] = useState(5)

    const range = preset === "custom" ? customRange : rangeFor(preset)
    const rangeKey = `${range.from}|${range.to}`
    const isRangeValid = range.from !== "" && range.to !== "" && range.from <= range.to
    // The server only allows hourly buckets for up to 31 days.
    const isHourlyAllowed = daysIn(range) <= MAX_HOURLY_DAYS
    const chosen = granularityChoice ?? defaultGranularity(range)
    const granularity = chosen === "HOUR" && !isHourlyAllowed ? "DAY" : chosen

    const summary = useApi(() => getSummary(range), `summary|${rangeKey}`)
    const revenue = useApi(() => getRevenueSeries(range, granularity), `revenue|${rangeKey}|${granularity}`)
    const tables = useApi(() => getTableOverview(range), `tables|${rangeKey}`)
    const top = useApi(() => getTopProducts(range, topBy), `top|${rangeKey}|${topBy}`)
    const lowStock = useApi(() => getLowStock(lowStockThreshold), `low|${lowStockThreshold}`)

    const change = summary.data?.revenueChangePercent ?? null

    const statCards = [
        { label: t.dashboard.tableRevenue, value: summary.data ? formatPrice(summary.data.tableRevenue) : "—" },
        { label: t.dashboard.fnbRevenue, value: summary.data ? formatPrice(summary.data.fnbRevenue) : "—" },
        { label: t.dashboard.invoices, value: summary.data ? String(summary.data.invoiceCount) : "—" },
        { label: t.dashboard.averageInvoice, value: summary.data ? formatPrice(summary.data.averageInvoice) : "—" },
    ]

    const statusCounts = (["AVAILABLE", "OCCUPIED", "MAINTENANCE"] as TableStatus[]).map((status) => ({
        status,
        count: tables.data?.statusCounts[status] ?? 0,
    }))

    const topMax = Math.max(...(top.data ?? []).map((p) => (topBy === "REVENUE" ? p.revenue : p.quantitySold)), 1)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="overflow-x-auto">
                    <Segmented
                        value={preset}
                        onChange={setPreset}
                        options={presets.map((value) => ({ value, label: t.dashboard.period[value] }))}
                    />
                </div>

                {preset === "custom" && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <label className="flex items-center gap-2">
                            {t.dashboard.period.from}
                            <input
                                type="date"
                                value={customRange.from}
                                max={customRange.to || undefined}
                                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                                className="h-10 rounded-xl border-none bg-white px-3 shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            {t.dashboard.period.to}
                            <input
                                type="date"
                                value={customRange.to}
                                min={customRange.from || undefined}
                                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                                className="h-10 rounded-xl border-none bg-white px-3 shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                        </label>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm lg:col-span-1">
                    <p className="text-lg font-medium text-emerald-50">{t.dashboard.revenue}</p>
                    <div>
                        <p className="mt-4 text-3xl font-semibold">
                            {summary.data ? formatPrice(summary.data.revenue) : "—"}
                        </p>
                        {change !== null && (
                            <p className="mt-1 text-sm text-emerald-50">
                                <span aria-hidden>{change >= 0 ? "▲" : "▼"}</span>{" "}
                                {Math.abs(change).toFixed(1)}% {t.dashboard.vsPrevious}
                            </p>
                        )}
                    </div>
                </div>

                {statCards.map((card) => (
                    <div key={card.label} className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-lg font-medium text-slate-700">{card.label}</p>
                        <p className="mt-4 text-2xl font-semibold text-slate-900">{card.value}</p>
                    </div>
                ))}
            </div>

            {summary.error && <p className="text-sm text-rose-600">{summary.error}</p>}

            <Card
                title={t.dashboard.chart.title}
                action={
                    <Segmented
                        value={granularity}
                        onChange={setGranularityChoice}
                        options={granularities
                            .filter((value) => value !== "HOUR" || isHourlyAllowed)
                            .map((value) => ({ value, label: t.dashboard.chart[value] }))}
                    />
                }
            >
                {!isRangeValid ? null : (
                    <Status isLoading={revenue.isLoading} error={revenue.error}>
                        {revenue.data && revenue.data.length > 0 ? (
                            <RevenueChart points={revenue.data} granularity={granularity} />
                        ) : (
                            <p className="py-10 text-center text-sm text-slate-500">{t.dashboard.chart.empty}</p>
                        )}
                    </Status>
                )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title={t.dashboard.tables.title}>
                    <Status isLoading={tables.isLoading} error={tables.error}>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {statusCounts.map(({ status, count }) => (
                                <span
                                    key={status}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
                                >
                                    {t.status[status]}: {count}
                                </span>
                            ))}
                        </div>

                        {!tables.data || tables.data.tables.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">{t.dashboard.tables.empty}</p>
                        ) : (
                            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                                {tables.data.tables.map((table) => (
                                    <li key={table.tableCode} className="py-3 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium text-slate-900">
                                                {formatTableCode(table.tableCode, t.tables.tableLabel)}
                                            </p>
                                            <span className="font-semibold text-amber-600">
                                                {formatPrice(table.tableRevenue)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600"
                                                    style={{ width: `${Math.min(100, table.utilizationPercent)}%` }}
                                                />
                                            </div>
                                            <span className="w-28 shrink-0 text-right">
                                                {t.dashboard.tables.usage} {Math.round(table.utilizationPercent)}%
                                                {" · "}
                                                {table.sessionCount} {t.dashboard.tables.sessions}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Status>
                </Card>

                <Card
                    title={t.dashboard.topProducts.title}
                    action={
                        <Segmented
                            value={topBy}
                            onChange={setTopBy}
                            options={(["REVENUE", "QUANTITY"] as const).map((value) => ({
                                value,
                                label: t.dashboard.topProducts[value],
                            }))}
                        />
                    }
                >
                    <Status isLoading={top.isLoading} error={top.error}>
                        {!top.data || top.data.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">{t.dashboard.topProducts.empty}</p>
                        ) : (
                            <ol className="flex flex-col gap-3">
                                {top.data.map((product, index) => {
                                    const value = topBy === "REVENUE" ? product.revenue : product.quantitySold
                                    return (
                                        <li key={product.productCode || index} className="text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="min-w-0 truncate font-medium text-slate-900">
                                                    {index + 1}. {product.name}
                                                </p>
                                                <p className="shrink-0 text-slate-600">
                                                    {topBy === "REVENUE"
                                                        ? formatPrice(product.revenue)
                                                        : `${product.quantitySold} ${t.dashboard.topProducts.sold}`}
                                                </p>
                                            </div>
                                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600"
                                                    style={{ width: `${(value / topMax) * 100}%` }}
                                                />
                                            </div>
                                        </li>
                                    )
                                })}
                            </ol>
                        )}
                    </Status>
                </Card>
            </div>

            <Card
                title={t.dashboard.lowStock.title}
                action={
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        {t.dashboard.lowStock.threshold}
                        <Segmented
                            value={lowStockThreshold}
                            onChange={setLowStockThreshold}
                            options={lowStockThresholds.map((value) => ({ value, label: `≤ ${value}` }))}
                        />
                    </div>
                }
            >
                <Status isLoading={lowStock.isLoading} error={lowStock.error}>
                    {!lowStock.data || lowStock.data.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-500">{t.dashboard.lowStock.empty}</p>
                    ) : (
                        <ul className="grid gap-x-6 sm:grid-cols-2">
                            {lowStock.data.map((product) => (
                                <li
                                    key={product.productCode}
                                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm"
                                >
                                    <span className="min-w-0 truncate font-medium text-slate-900">{product.name}</span>
                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                            product.quantity <= 0
                                                ? "bg-rose-50 text-rose-700"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {product.quantity} {t.stock.units}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Status>
            </Card>
        </div>
    )
}
