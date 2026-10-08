export const inputClass =
    "mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"

export const secondaryButtonClass =
    "btn h-12 rounded-xl border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"

export const primaryButtonClass =
    "btn h-12 rounded-xl border-none bg-emerald-700 text-white shadow-none hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"

export const dangerButtonClass =
    "btn h-12 rounded-xl border-none bg-rose-600 text-white shadow-none hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400"

export function optionClass(selected: boolean) {
    return `cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
        selected
            ? "border-emerald-700 bg-emerald-50 text-emerald-800"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
    }`
}
