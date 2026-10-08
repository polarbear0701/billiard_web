import { useLanguage } from "../i18n/useLanguage"
import type { Language } from "../i18n/translations"

const options: { value: Language; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "vi", label: "VI" },
]

export default function LanguageToggle() {
    const { language, setLanguage, t } = useLanguage()

    return (
        <div
            role="group"
            aria-label={t.language.label}
            className="flex rounded-xl bg-slate-100 p-1"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={language === option.value}
                    onClick={() => setLanguage(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        language === option.value
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
