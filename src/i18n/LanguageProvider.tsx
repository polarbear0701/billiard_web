import { useEffect, useMemo, useState, type ReactNode } from "react"
import { LanguageContext } from "./LanguageContext"
import { translations, type Language } from "./translations"

const STORAGE_KEY = "language"

function getInitialLanguage(): Language {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === "en" || stored === "vi") return stored
    } catch {
        // storage unavailable, fall through to the default
    }
    return "en"
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(getInitialLanguage)

    useEffect(() => {
        document.documentElement.lang = language
        try {
            localStorage.setItem(STORAGE_KEY, language)
        } catch {
            // ignore persistence failures
        }
    }, [language])

    const value = useMemo(
        () => ({ language, setLanguage, t: translations[language] }),
        [language]
    )

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
