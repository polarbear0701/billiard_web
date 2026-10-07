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
