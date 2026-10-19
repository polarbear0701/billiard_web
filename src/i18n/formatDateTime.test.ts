import { describe, expect, it } from "vitest"
import { minutesBetween, shiftServerTime } from "./formatDateTime"

describe("shiftServerTime", () => {
    it("moves a server timestamp earlier and writes it back without a timezone", () => {
        expect(shiftServerTime("2026-10-18T18:27:11.187462", -30)).toBe("2026-10-18T17:57:11")
    })

    it("crosses midnight", () => {
        expect(shiftServerTime("2026-10-19T00:10:00", -15)).toBe("2026-10-18T23:55:00")
    })

    it("moves later too", () => {
        expect(shiftServerTime("2026-10-18T09:58:00", 5)).toBe("2026-10-18T10:03:00")
    })

    it("returns null for something that is not a date", () => {
        expect(shiftServerTime("not a date", 5)).toBeNull()
    })
})

describe("minutesBetween", () => {
    it("counts whole minutes between two server timestamps", () => {
        expect(minutesBetween("2026-10-18T18:00:00.123456", "2026-10-18T19:25:40")).toBe(86)
    })

    it("is null while the session has no end time", () => {
        expect(minutesBetween("2026-10-18T18:00:00", null)).toBeNull()
    })
})
