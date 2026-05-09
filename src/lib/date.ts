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
 * Resolve the anchor (Monday of plan week 1) for a plan.
 *
 * Plans store days as `day_of_week` (1=Mon..7=Sun) within numbered weeks.
 * Calendar dates are computed as `anchor + (week-1)*7 + (dow-1)`. The anchor
 * MUST be a Monday for day_of_week=N to align with that real weekday.
 *
 * Snap policy: the anchor is the **first Monday on or after start_date**.
 *
 * Why "on or after" rather than "of the same week":
 *   When a coach assigns a plan with start_date = Sat May 9 and programs
 *   day_of_week=1 (Monday), they almost always mean "the upcoming Monday"
 *   (May 11), not the Monday five days BEFORE the start (May 4). Snapping
 *   backward placed all programmed days before the start_date, which is
 *   incoherent. Snapping forward keeps the entire plan on or after start_date.
 *
 * If start_date is already a Monday, the anchor is start_date itself (no shift).
 */
export function resolvePlanAnchor(startDate: string | Date | null | undefined): Date {
  const parsed = parseLocalDate(startDate)
  const base = parsed ?? localToday()
  const iso = isoWeekday(base)
  if (iso !== 1) {
    base.setDate(base.getDate() + (8 - iso))
  }
  return base
}

/** Compute the actual local date for a (week, dayOfWeek) pair anchored on a plan start date. */
export function planDayToLocalDate(weekNum: number, dayOfWeek: number, anchor: Date): Date {
  const d = new Date(anchor)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (Math.max(1, weekNum) - 1) * 7 + (Math.max(1, dayOfWeek) - 1))
  return d
}
