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

describe("role and username from the access token", () => {
    const tokenWith = (claims: object) => `header.${btoa(JSON.stringify(claims))}.signature`

    it("reads the role from a role, roles or authorities claim", async () => {
        const { getRoleFromToken } = await import("./auth")

        expect(getRoleFromToken(tokenWith({ role: "ROLE_ADMIN" }))).toBe("ADMIN")
        expect(getRoleFromToken(tokenWith({ roles: ["STAFF"] }))).toBe("STAFF")
        expect(getRoleFromToken(tokenWith({ authorities: ["ROLE_ADMIN", "ROLE_STAFF"] }))).toBe("ADMIN")
    })

    it("treats a missing or unreadable role as unknown, which keeps the admin UI visible", async () => {
        const { getRoleFromToken, isAdminUser } = await import("./auth")

        expect(getRoleFromToken(tokenWith({ sub: "someone" }))).toBeNull()
        expect(getRoleFromToken("opaque")).toBeNull()

        localStorage.setItem("accessToken", "opaque")
        expect(isAdminUser()).toBe(true)
    })

    it("hides admin features only for a token that says STAFF", async () => {
        const { isAdminUser, getCurrentUsername } = await import("./auth")

        localStorage.setItem("accessToken", tokenWith({ sub: "nhan", role: "STAFF" }))
        expect(isAdminUser()).toBe(false)
        expect(getCurrentUsername()).toBe("nhan")
    })
})
