import { useState } from "react"
import type { Granularity, RevenuePoint } from "../services/dashboard"
import { parseServerDate } from "../i18n/formatDateTime"
import { useLanguage } from "../i18n/useLanguage"

interface RevenueChartProps {
    points: RevenuePoint[]
    granularity: Granularity
}

const GRID_LINES = 4

// Two series, validated as a pair (CVD and contrast) with the dataviz palette checker.
const TABLE_COLOR = "bg-[#059669]"
const FNB_COLOR = "bg-[#4f46e5]"

// Round the top of the axis up to 1, 2, 2.5, 5 or 10 times a power of ten.
function niceMax(value: number) {
    if (value <= 0) return 1
    const power = 10 ** Math.floor(Math.log10(value))
    const ratio = value / power
    const step = ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 2.5 ? 2.5 : ratio <= 5 ? 5 : 10
    return step * power
}

function formatBucket(bucket: string, granularity: Granularity) {
    const date = parseServerDate(bucket)
    if (!date) return bucket

    const pad = (n: number) => String(n).padStart(2, "0")
    if (granularity === "HOUR") return `${pad(date.getHours())}:00`
    if (granularity === "MONTH") return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

export default function RevenueChart({ points, granularity }: RevenueChartProps) {
    const { t, language } = useLanguage()
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const locale = language === "vi" ? "vi-VN" : "en-US"

    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 })
    const full = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    })

    const max = niceMax(Math.max(...points.map((p) => p.revenue), 0))
    // Show about 8 x-axis labels however many bars there are, so they never collide.
    const labelEvery = Math.max(1, Math.ceil(points.length / 8))
    const active = activeIndex === null ? null : points[activeIndex]
    const heightOf = (value: number) => `${(value / max) * 100}%`

    return (
        <div>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-sm ${TABLE_COLOR}`} />
                    {t.dashboard.chart.tableTime}
                </span>
                <span className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-sm ${FNB_COLOR}`} />
                    {t.dashboard.chart.foodDrinks}
                </span>
            </div>

            <div className="relative pl-12 pt-2" onMouseLeave={() => setActiveIndex(null)}>
                <div className="relative h-56">
                    {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
                        <div
                            key={i}
                            className="absolute inset-x-0 border-t border-slate-100"
                            style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
                        >
                            <span className="absolute -left-12 w-10 -translate-y-1/2 text-right text-xs text-slate-400">
                                {compact.format((max / GRID_LINES) * i)}
                            </span>
                        </div>
                    ))}

                    <div className="absolute inset-0 flex items-end gap-0.5">
                        {points.map((point, index) => (
                            <button
                                key={point.bucket}
                                type="button"
                                aria-label={`${formatBucket(point.bucket, granularity)}: ${full.format(point.revenue)}`}
                                className="relative flex h-full min-w-0 flex-1 flex-col justify-end focus:outline-none"
                                onMouseEnter={() => setActiveIndex(index)}
                                onFocus={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)}
                            >
                                {/* Food & drinks stacked on top of table time, 2px apart. */}
                                <span
                                    className={`block w-full rounded-t-[4px] ${FNB_COLOR} ${
                                        activeIndex === index ? "opacity-100" : "opacity-90"
                                    }`}
                                    style={{ height: heightOf(point.fnbRevenue) }}
                                />
                                <span
                                    className={`block w-full ${TABLE_COLOR} ${
                                        point.fnbRevenue > 0 ? "mt-0.5" : "rounded-t-[4px]"
                                    } ${activeIndex === index ? "opacity-100" : "opacity-90"}`}
                                    style={{ height: heightOf(point.tableRevenue) }}
                                />
                            </button>
                        ))}
                    </div>

                    {active && activeIndex !== null && (
                        <div
                            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
                            style={{
                                left: `${((activeIndex + 0.5) / points.length) * 100}%`,
                                bottom: `calc(${heightOf(active.revenue)} + 8px)`,
                            }}
                        >
                            <p className="text-slate-300">{formatBucket(active.bucket, granularity)}</p>
                            <p className="font-semibold">{full.format(active.revenue)}</p>
                            <p className="mt-1 text-slate-300">
                                {t.dashboard.chart.tableTime}: {full.format(active.tableRevenue)}
                            </p>
                            <p className="text-slate-300">
                                {t.dashboard.chart.foodDrinks}: {full.format(active.fnbRevenue)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-2 flex gap-0.5">
                    {points.map((point, index) => (
                        <span key={point.bucket} className="min-w-0 flex-1 text-center text-xs text-slate-400">
                            {index % labelEvery === 0 ? (
                                <span className="inline-block whitespace-nowrap">
                                    {formatBucket(point.bucket, granularity)}
                                </span>
                            ) : null}
                        </span>
                    ))}
                </div>

                {/* Screen-reader table with the same numbers as the chart. */}
                <table className="sr-only">
                    <thead>
                        <tr>
                            <th />
                            <th>{t.dashboard.chart.tableTime}</th>
                            <th>{t.dashboard.chart.foodDrinks}</th>
                            <th>{t.dashboard.revenue}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((point) => (
                            <tr key={point.bucket}>
                                <th>{formatBucket(point.bucket, granularity)}</th>
                                <td>{full.format(point.tableRevenue)}</td>
                                <td>{full.format(point.fnbRevenue)}</td>
                                <td>{full.format(point.revenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
