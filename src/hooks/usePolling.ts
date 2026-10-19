import { useEffect, useRef } from "react"

// Calls `onTick` every `intervalMs` while the tab is visible, and once more
// as soon as the tab becomes visible again.
export function usePolling(onTick: () => void, intervalMs: number) {
    const onTickRef = useRef(onTick)

    useEffect(() => {
        onTickRef.current = onTick
    })

    useEffect(() => {
        function tick() {
            if (document.visibilityState === "visible") onTickRef.current()
        }

        const timer = window.setInterval(tick, intervalMs)
        document.addEventListener("visibilitychange", tick)

        return () => {
            window.clearInterval(timer)
            document.removeEventListener("visibilitychange", tick)
        }
    }, [intervalMs])
}
