import { http, type ApiResponse } from "./http"

interface LoginData {
    accessToken: string
    refreshToken: string
    // lifetime of the access token, in milliseconds
    expiresIn: number
}


export async function login(
    username: string,
    password: string
) {
    const res = await http.post<ApiResponse<LoginData>> (
        "/auth/login",
        {username, password}
    )
    return res.data.data
}

export function logout (): void {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
}

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        )
        return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()
    } catch {
        // Not a readable JWT: let the server decide.
        return false
    }
}

// An expired access token is fine (it is refreshed on the next request); the user only
// has to sign in again when the refresh token is gone or expired.
export function hasActiveSession(): boolean {
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")

    const isActive = refreshToken
        ? !isTokenExpired(refreshToken)
        : accessToken !== null && !isTokenExpired(accessToken)

    if (!isActive) logout()
    return isActive
}

export type Role = "ADMIN" | "STAFF"

// The login response does not include the role, so read it from the access token when the
// token carries one. null means "unknown": the UI then shows everything and the server
// answers 403 for what the account may not do.
function readPayload(token: string | null): Record<string, unknown> | null {
    if (!token) return null

    try {
        return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    } catch {
        return null
    }
}

export function getRoleFromToken(token: string | null): Role | null {
    const payload = readPayload(token)
    if (!payload) return null

    try {
        const claim = payload.role ?? payload.roles ?? payload.authorities ?? payload.scope
        const text = (Array.isArray(claim) ? claim : [claim]).join(" ").toUpperCase()

        if (text.includes("ADMIN")) return "ADMIN"
        if (text.includes("STAFF")) return "STAFF"
    } catch {
        // an unexpected claim shape
    }
    return null
}

export function getCurrentUsername(): string | null {
    const payload = readPayload(localStorage.getItem("accessToken"))
    const name = payload?.sub ?? payload?.username
    return typeof name === "string" ? name : null
}

export function getCurrentRole(): Role | null {
    return getRoleFromToken(localStorage.getItem("accessToken"))
}

// true unless the token says the account is STAFF (an unknown role counts as admin; the
// server still enforces it).
export function isAdminUser(): boolean {
    return getCurrentRole() !== "STAFF"
}
