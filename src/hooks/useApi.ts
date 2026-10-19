import { useEffect, useRef, useState } from "react"
import { getErrorMessage } from "../services/http"

interface ApiState<T> {
    key: string
    data?: T
    error?: string
}

// Loads data whenever `key` changes. The previous data stays available while the next
// request is in flight, so charts don't blank out when a filter changes.
export function useApi<T>(fetcher: () => Promise<T>, key: string) {
    const [state, setState] = useState<ApiState<T> | null>(null)
    const fetcherRef = useRef(fetcher)

    useEffect(() => {
        fetcherRef.current = fetcher
    })

    useEffect(() => {
        let isCancelled = false

        fetcherRef
            .current()
            .then((data) => {
                if (!isCancelled) setState({ key, data })
            })
            .catch((err) => {
                if (!isCancelled) setState((prev) => ({ key, data: prev?.data, error: getErrorMessage(err) }))
            })

        return () => {
            isCancelled = true
        }
    }, [key])

    const isCurrent = state?.key === key

    return {
        data: state?.data,
        error: isCurrent ? state?.error : undefined,
        isLoading: !isCurrent,
    }
}
