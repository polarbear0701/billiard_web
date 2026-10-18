import { useLanguage } from "../i18n/useLanguage"

export default function Dashboard() {
    const { t } = useLanguage()

    return (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            {t.dashboard.comingSoon}
        </p>
    )
}
