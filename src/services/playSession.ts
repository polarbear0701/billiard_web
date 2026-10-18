import { http, type ApiResponse } from "./http"

export type SessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export interface PlaySession {
    sessionCode: string
    tableCode: string
    startTime: string
    endTime: string | null
    sessionStatus: SessionStatus
}

export async function startPlaySession(tableCode: string): Promise<PlaySession> {
    const res = await http.post<ApiResponse<PlaySession>>("/play-session/create", {
        tableCode,
        sessionStatus: "ACTIVE",
    })

    return res.data.data
}

export async function getCurrentPlaySession(tableCode: string): Promise<PlaySession> {
    const res = await http.get<ApiResponse<PlaySession>>("/play-session/current", {
        params: { tableCode },
    })

    return res.data.data
}

export async function getCurrentFee(sessionCode: string): Promise<number> {
    const res = await http.get<ApiResponse<number>>("/play-session/fee", {
        params: { playSessionCode: sessionCode },
    })

    return Number(res.data.data)
}

export async function getPlaySessionByCode(sessionCode: string): Promise<PlaySession> {
    const res = await http.get<ApiResponse<PlaySession>>(
        `/play-session/session-code/${encodeURIComponent(sessionCode)}`
    )

    return res.data.data
}
