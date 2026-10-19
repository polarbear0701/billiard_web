import { useState, type FormEvent } from "react"
import { useApi } from "../hooks/useApi"
import { formatDateTime } from "../i18n/formatDateTime"
import { useLanguage } from "../i18n/useLanguage"
import {
    AUDIT_ACTIONS,
    AUDIT_ENTITY_TYPES,
    describeChange,
    searchAuditLogs,
    type AuditFilters,
} from "../services/audit"

const emptyFilters: AuditFilters = {
    actor: "",
    entityType: "",
    entityCode: "",
    action: "",
    from: "",
    to: "",
}

function actionStyle(action: string) {
    if (action === "CREATE") return "bg-emerald-50 text-emerald-700"
    if (action === "DELETE" || action === "CANCEL" || action === "CLEAR_STOCK") return "bg-rose-50 text-rose-700"
    if (action === "END" || action === "COMPLETE") return "bg-indigo-50 text-indigo-700"
    return "bg-amber-50 text-amber-700"
}

const inputClass =
    "h-11 min-w-0 rounded-xl border-none bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100"

export default function AuditLog() {
    const { t, language } = useLanguage()
    // `draft` is what the form shows; `applied` is what was last searched.
    const [draft, setDraft] = useState<AuditFilters>(emptyFilters)
    const [applied, setApplied] = useState<AuditFilters>(emptyFilters)
    const [page, setPage] = useState(0)

    const logs = useApi(() => searchAuditLogs(applied, page), `${JSON.stringify(applied)}|${page}`)

    function setField(field: keyof AuditFilters, value: string) {
        setDraft((prev) => ({ ...prev, [field]: value }))
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault()
        setApplied(draft)
        setPage(0)
    }

    function handleReset() {
        setDraft(emptyFilters)
        setApplied(emptyFilters)
        setPage(0)
    }

    const data = logs.data
    const actionLabels: Record<string, string> = t.audit.actions
    const entityLabels: Record<string, string> = t.audit.entityTypes


    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={handleSearch}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            >
                <input
                    type="search"
                    placeholder={t.audit.actor}
                    aria-label={t.audit.actor}
                    value={draft.actor}
                    onChange={(e) => setField("actor", e.target.value)}
                    className={inputClass}
                />

                <select
                    aria-label={t.audit.entityType}
                    value={draft.entityType}
                    onChange={(e) => setField("entityType", e.target.value)}
                    className={inputClass}
                >
                    <option value="">{t.audit.allEntities}</option>
                    {AUDIT_ENTITY_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {entityLabels[type]}
                        </option>
                    ))}
                </select>

                <input
                    type="search"
                    placeholder={t.audit.entityCode}
                    aria-label={t.audit.entityCode}
                    value={draft.entityCode}
                    onChange={(e) => setField("entityCode", e.target.value)}
                    className={inputClass}
                />

                <select
                    aria-label={t.audit.action}
                    value={draft.action}
                    onChange={(e) => setField("action", e.target.value)}
                    className={inputClass}
                >
                    <option value="">{t.audit.allActions}</option>
                    {AUDIT_ACTIONS.map((action) => (
                        <option key={action} value={action}>
                            {actionLabels[action]}
                        </option>
                    ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-slate-500">
                    {t.audit.from}
                    <input
                        type="date"
                        value={draft.from}
                        max={draft.to || undefined}
                        onChange={(e) => setField("from", e.target.value)}
                        className={`${inputClass} flex-1`}
                    />
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-500">
                    {t.audit.to}
                    <input
                        type="date"
                        value={draft.to}
                        min={draft.from || undefined}
                        onChange={(e) => setField("to", e.target.value)}
                        className={`${inputClass} flex-1`}
                    />
                </label>

                <div className="flex gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-6">
                    <button
                        type="submit"
                        className="btn h-11 rounded-xl border-none bg-emerald-700 px-6 text-white shadow-none hover:bg-emerald-800"
                    >
                        {t.audit.apply}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn h-11 rounded-xl border-slate-300 bg-white px-6 text-slate-700 shadow-none hover:bg-slate-50"
                    >
                        {t.audit.reset}
                    </button>
                </div>
            </form>

            {logs.error ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-rose-600 shadow-sm">{logs.error}</p>
            ) : !data ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    {t.audit.loading}
                </p>
            ) : data.content.length === 0 ? (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    {t.audit.empty}
                </p>
            ) : (
                <div className={`overflow-x-auto rounded-2xl bg-white shadow-sm ${logs.isLoading ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <th className="px-5 py-4 font-medium">{t.audit.time}</th>
                                <th className="px-5 py-4 font-medium">{t.audit.actor}</th>
                                <th className="px-5 py-4 font-medium">{t.audit.action}</th>
                                <th className="px-5 py-4 font-medium">{t.audit.entity}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {data.content.map((entry) => {
                                const changes = describeChange(entry.oldValue, entry.newValue)

                                return (
                                    <tr key={entry.id} className="align-top transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                            {formatDateTime(entry.occurredAt, language)}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-900">{entry.actor}</td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${actionStyle(entry.action)}`}
                                            >
                                                {actionLabels[entry.action] ?? entry.action}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {entityLabels[entry.entityType] ?? entry.entityType}
                                            <span className="ml-1 font-medium text-slate-900">{entry.entityCode}</span>

                                            {changes.length > 0 && (
                                                <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                                                    {changes.map((change) => (
                                                        <li key={change.field} className="break-words">
                                                            <span className="font-medium text-slate-600">{change.field}</span>
                                                            {": "}
                                                            {change.from === null
                                                                ? change.to
                                                                : change.to === null
                                                                  ? `${change.from} (${t.audit.removed})`
                                                                  : `${change.from} → ${change.to}`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row">
                        <p>
                            {t.audit.total.replace("{count}", String(data.totalElements))}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                disabled={page === 0 || logs.isLoading}
                                onClick={() => setPage(page - 1)}
                            >
                                {t.invoices.previous}
                            </button>
                            <span>{t.audit.page.replace("{page}", String(page + 1))}</span>
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                disabled={data.last || logs.isLoading}
                                onClick={() => setPage(page + 1)}
                            >
                                {t.invoices.next}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
