import { beforeEach, describe, expect, it } from "vitest"
import { hasActiveSession } from "./auth"

function jwt(expSecondsFromNow: number) {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))
    return `header.${payload}.signature`
}

beforeEach(() => localStorage.clear())

describe("hasActiveSession", () => {
    it("is false with no tokens", () => {
        expect(hasActiveSession()).toBe(false)
    })

    it("stays active with an expired access token while the refresh token is valid", () => {
        localStorage.setItem("accessToken", jwt(-60))
        localStorage.setItem("refreshToken", jwt(3600))
        expect(hasActiveSession()).toBe(true)
    })

    it("ends the session and clears tokens when the refresh token has expired", () => {
        localStorage.setItem("accessToken", jwt(3600))
        localStorage.setItem("refreshToken", jwt(-60))
        expect(hasActiveSession()).toBe(false)
        expect(localStorage.getItem("accessToken")).toBeNull()
        expect(localStorage.getItem("refreshToken")).toBeNull()
    })

    it("trusts tokens it cannot decode and lets the server decide", () => {
        localStorage.setItem("accessToken", "opaque")
        localStorage.setItem("refreshToken", "opaque")
        expect(hasActiveSession()).toBe(true)
    })
})
