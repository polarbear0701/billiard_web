import { http, type ApiResponse } from "./http"

interface LoginData {
    accessToken: string
    refreshToken: string
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
