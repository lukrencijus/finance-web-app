/**
 * Unit constants for housing categories.
 *
 * Split out of lib/housing.ts so client components can import them: that module
 * pulls in the Prisma client, which cannot be bundled for the browser.
 */

/**
 * What a housing category is measured in.
 *
 * `amount` on a HousingEntry is euros for every unit - the unit only decides
 * whether a `quantity` field is shown alongside it, and how that quantity is
 * labelled. So a m³ category still contributes its euros to the month total,
 * exactly like a plain EUR one.
 */
export const HOUSING_UNITS = ["EUR", "M3", "KWH"] as const
export type HousingUnit = (typeof HOUSING_UNITS)[number]

export function isHousingUnit(value: string): value is HousingUnit {
    return (HOUSING_UNITS as readonly string[]).includes(value)
}

/** Short suffix shown next to a quantity, e.g. "3,50 m³". */
export const UNIT_SUFFIX: Record<HousingUnit, string> = {
    EUR: "",
    M3: "m³",
    KWH: "kWh",
}

export const UNIT_LABEL: Record<HousingUnit, string> = {
    EUR: "Euros only",
    M3: "Cubic metres + €",
    KWH: "Kilowatt-hours + €",
}

/** EUR categories have no meter reading to record. */
export function isMetered(unit: string): boolean {
    return unit === "M3" || unit === "KWH"
}
