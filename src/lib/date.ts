/**
 * Parse a "YYYY-MM-DD" string as a LOCAL date (midnight in user's timezone).
 *
 * `new Date("2026-05-04")` is parsed as UTC midnight, which in negative-offset
 * timezones (e.g. Chile UTC-3/-4) actually points to the PREVIOUS local day.
 * That bug shifts the whole plan calendar by one day.
 */
export function parseLocalDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null
  if (input instanceof Date) {
    const d = new Date(input)
    d.setHours(0, 0, 0, 0)
    return d
  }
  // ISO date-only form
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (m) {
    const [, y, mo, da] = m
    return new Date(Number(y), Number(mo) - 1, Number(da))
  }
  const fallback = new Date(input)
  if (isNaN(fallback.getTime())) return null
  fallback.setHours(0, 0, 0, 0)
  return fallback
}

/** "YYYY-MM-DD" in local timezone for a given Date. */
export function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Today's local date at midnight. */
export function localToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO weekday: Monday=1 ... Sunday=7. */
export function isoWeekday(d: Date = new Date()): number {
  const day = d.getDay()
  return day === 0 ? 7 : day
}

/**
 * Resolve the anchor (Monday of week 1) for a plan.
 * If startDate is provided, parse it as local. Otherwise use the current local Monday.
 */
export function resolvePlanAnchor(startDate: string | Date | null | undefined): Date {
  const parsed = parseLocalDate(startDate)
  if (parsed) return parsed
  const today = localToday()
  const iso = isoWeekday(today)
  today.setDate(today.getDate() - (iso - 1))
  return today
}

/** Compute the actual local date for a (week, dayOfWeek) pair anchored on a plan start date. */
export function planDayToLocalDate(weekNum: number, dayOfWeek: number, anchor: Date): Date {
  const d = new Date(anchor)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (Math.max(1, weekNum) - 1) * 7 + (Math.max(1, dayOfWeek) - 1))
  return d
}
