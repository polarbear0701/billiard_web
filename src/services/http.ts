import axios from "axios";

export const http = axios.create(
    {baseURL: import.meta.env.VITE_API_URL}
)

export interface ApiResponse<T> {
    code: number
    message: string
    data: T
    timestamp: string
}

http.interceptors.request.use ((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export function getErrorMessage(err: unknown): string {
    if (axios.isAxiosError<{ message?: string}> (err)) {
        return err.response?.data?.message ?? "Cannot reach the server"
    }

    return "Something went wrong! Please try again"
}