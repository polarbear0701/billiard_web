import axios, { type InternalAxiosRequestConfig } from "axios";

export const http = axios.create(
    {baseURL: import.meta.env.VITE_API_URL}
)

export interface ApiResponse<T> {
    code: number
    message: string
    data: T
    timestamp: string
}

interface RefreshData {
    accessToken: string
    refreshToken?: string
}

// Separate client with no interceptors, so a failing refresh can't trigger another refresh.
const refreshClient = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Shared by all requests that hit a 401 at the same time, so only one refresh is sent.
let refreshPromise: Promise<string> | null = null

function clearSessionAndRedirect(): never {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    if (window.location.pathname !== "/login") {
        window.location.assign("/login")
    }
    throw new Error("Session expired")
}

async function requestNewAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) return clearSessionAndRedirect()

    try {
        const res = await refreshClient.post<ApiResponse<RefreshData>>(
            "/auth/refresh",
            { refreshToken }
        )
        const { accessToken, refreshToken: rotatedRefreshToken } = res.data.data

        localStorage.setItem("accessToken", accessToken)
        if (rotatedRefreshToken) {
            localStorage.setItem("refreshToken", rotatedRefreshToken)
        }
        return accessToken
    } catch {
        return clearSessionAndRedirect()
    }
}

http.interceptors.request.use ((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

http.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error) || !error.config) throw error

        const config = error.config as RetriableConfig
        const isAuthRequest = config.url?.startsWith("/auth/")

        // Only an expired/invalid access token on a normal request is worth refreshing.
        if (error.response?.status !== 401 || isAuthRequest || config._retried) {
            throw error
        }

        config._retried = true
        refreshPromise ??= requestNewAccessToken().finally(() => {
            refreshPromise = null
        })

        const accessToken = await refreshPromise
        config.headers.Authorization = `Bearer ${accessToken}`
        return http(config)
    }
)

export function getErrorMessage(err: unknown): string {
    if (axios.isAxiosError<{ message?: string}> (err)) {
        return err.response?.data?.message ?? "Cannot reach the server"
    }

    return "Something went wrong! Please try again"
}