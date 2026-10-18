import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }

// A fake network layer: both the main client and the refresh client inherit this adapter.
function installAdapter(handler: Handler) {
    const calls: InternalAxiosRequestConfig[] = []

    const adapter: AxiosAdapter = async (config) => {
        calls.push(config)
        const { status, data } = handler(config)
        const response = { data, status, statusText: "", headers: {}, config }

        if (status >= 200 && status < 300) return response
        throw new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, null, response)
    }

    axios.defaults.adapter = adapter
    return calls
}

const ok = (data: unknown) => ({ status: 200, data: { code: 200, message: "ok", data } })
const unauthorized = { status: 401, data: { message: "Unauthorized" } }

// Re-import so the clients are created with the fake adapter.
async function loadHttp() {
    vi.resetModules()
    return import("./http")
}

beforeEach(() => {
    localStorage.clear()
    localStorage.setItem("accessToken", "old-access")
    localStorage.setItem("refreshToken", "refresh-1")
})

describe("token refresh", () => {
    it("refreshes after a 401 and retries the original request with the new token", async () => {
        const calls = installAdapter((config) => {
            if (config.url === "/auth/refresh") return ok({ accessToken: "new-access" })
            return config.headers.Authorization === "Bearer new-access"
                ? ok("secret")
                : unauthorized
        })
        const { http } = await loadHttp()

        const res = await http.get("/table/all")

        expect(res.data.data).toBe("secret")
        expect(localStorage.getItem("accessToken")).toBe("new-access")
        expect(calls.map((c) => c.url)).toEqual(["/table/all", "/auth/refresh", "/table/all"])
        expect(calls[1].data).toBe(JSON.stringify({ refreshToken: "refresh-1" }))
    })

    it("stores a rotated refresh token when the server returns one", async () => {
        installAdapter((config) => {
            if (config.url === "/auth/refresh") {
                return ok({ accessToken: "new-access", refreshToken: "refresh-2" })
            }
            return config.headers.Authorization === "Bearer new-access" ? ok(1) : unauthorized
        })
        const { http } = await loadHttp()

        await http.get("/table/all")

        expect(localStorage.getItem("refreshToken")).toBe("refresh-2")
    })

    it("sends only one refresh when several requests fail at once", async () => {
        const calls = installAdapter((config) => {
            if (config.url === "/auth/refresh") return ok({ accessToken: "new-access" })
            return config.headers.Authorization === "Bearer new-access" ? ok(1) : unauthorized
        })
        const { http } = await loadHttp()

        await Promise.all([http.get("/a"), http.get("/b"), http.get("/c")])

        expect(calls.filter((c) => c.url === "/auth/refresh")).toHaveLength(1)
    })

    it("clears the session and signals expiry when the refresh fails", async () => {
        installAdapter((config) =>
            config.url === "/auth/refresh" ? unauthorized : unauthorized
        )
        const { http, sessionEvents } = await loadHttp()
        sessionEvents.onExpired = vi.fn()

        await expect(http.get("/table/all")).rejects.toThrow("Session expired")

        expect(localStorage.getItem("accessToken")).toBeNull()
        expect(localStorage.getItem("refreshToken")).toBeNull()
        expect(sessionEvents.onExpired).toHaveBeenCalledOnce()
    })

    it("does not try to refresh when there is no refresh token", async () => {
        localStorage.removeItem("refreshToken")
        const calls = installAdapter(() => unauthorized)
        const { http, sessionEvents } = await loadHttp()
        sessionEvents.onExpired = vi.fn()

        await expect(http.get("/table/all")).rejects.toThrow("Session expired")

        expect(calls.some((c) => c.url === "/auth/refresh")).toBe(false)
        expect(sessionEvents.onExpired).toHaveBeenCalledOnce()
    })

    it("does not refresh for /auth/ requests such as a wrong password", async () => {
        const calls = installAdapter(() => unauthorized)
        const { http } = await loadHttp()

        await expect(http.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError)

        expect(calls).toHaveLength(1)
    })

    it("does not retry a request more than once", async () => {
        const calls = installAdapter((config) =>
            config.url === "/auth/refresh" ? ok({ accessToken: "new-access" }) : unauthorized
        )
        const { http } = await loadHttp()

        await expect(http.get("/table/all")).rejects.toBeInstanceOf(AxiosError)

        expect(calls.map((c) => c.url)).toEqual(["/table/all", "/auth/refresh", "/table/all"])
    })

    it("passes through errors that are not 401", async () => {
        const calls = installAdapter(() => ({ status: 500, data: { message: "boom" } }))
        const { http } = await loadHttp()

        await expect(http.get("/table/all")).rejects.toBeInstanceOf(AxiosError)

        expect(calls).toHaveLength(1)
    })
})
