import { describe, expect, it } from "vitest"
import { describeChange } from "./audit"

describe("describeChange", () => {
    it("lists only the fields that changed, ignoring timestamps and bookkeeping", () => {
        const changes = describeChange(
            { productCode: "PRD000001", price: 15000, updatedAt: "2026-10-19T10:00:00", updatedBy: "admin" },
            { productCode: "PRD000001", price: 18000, updatedAt: "2026-10-19T11:00:00", updatedBy: "staff" }
        )

        expect(changes).toEqual([{ field: "price", from: "15000", to: "18000" }])
    })

    it("shows every field of a created record (no old snapshot)", () => {
        const changes = describeChange(null, { productCode: "PRD000002", name: "Cola", createdAt: "x" })

        expect(changes).toEqual([
            { field: "productCode", from: null, to: "PRD000002" },
            { field: "name", from: null, to: "Cola" },
        ])
    })

    it("shows every field of a deleted record (no new snapshot)", () => {
        expect(describeChange({ name: "Cola" }, null)).toEqual([
            { field: "name", from: "Cola", to: null },
        ])
    })

    it("is empty when nothing differs", () => {
        expect(describeChange({ a: 1 }, { a: 1 })).toEqual([])
    })
})
