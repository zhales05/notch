/** Returns "YYYY-MM-DD" for a given Date */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Returns a display string like "Mon, Apr 4" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/** Check if a date is today (local time) */
export function isToday(date: Date): boolean {
  return formatDateKey(date) === formatDateKey(new Date())
}

/** Get the Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get the first day of the month containing the given date */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Returns an array of N "YYYY-MM-DD" keys ending at `from` (inclusive) */
export function getLastNDays(n: number, from: Date): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from)
    d.setDate(d.getDate() - i)
    days.push(formatDateKey(d))
  }
  return days
}

/** Get the short day label (M, T, W, ...) for a date */
export function getDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)
}

/** Parse a "YYYY-MM-DD" string into a Date (local time) */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Returns an array of N week boundaries ending at `from`, each with start/end date keys and a label */
export function getLastNWeeks(
  n: number,
  from: Date
): Array<{ start: string; end: string; label: string }> {
  const weeks: Array<{ start: string; end: string; label: string }> = []
  const currentWeekStart = getWeekStart(from)

  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(currentWeekStart)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    weeks.push({
      start: formatDateKey(start),
      end: formatDateKey(end),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  }

  return weeks
}

/** Returns an array of N month boundaries ending at the month containing `from` */
export function getLastNMonths(
  n: number,
  from: Date
): Array<{ month: string; label: string; daysInMonth: number }> {
  const months: Array<{ month: string; label: string; daysInMonth: number }> = []

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    months.push({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      daysInMonth,
    })
  }

  return months
}
