// `datetime-local` inputs have no timezone. These helpers bridge the input's
// wall-clock string and the ISO-with-offset string the API expects, stamping
// the browser's local offset so the two represent the same instant.

// "2026-07-28T08:30" -> "2026-07-28T08:30:00+07:00" (local offset)
export function toIsoWithOffset(local: string): string {
    if (!local) return ''
    const date = new Date(local)
    if (isNaN(date.getTime())) return ''

    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')
    const offsetMin = -date.getTimezoneOffset()
    const sign = offsetMin >= 0 ? '+' : '-'
    const offset = `${sign}${pad(offsetMin / 60)}:${pad(offsetMin % 60)}`

    const y = date.getFullYear()
    const mo = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const mi = pad(date.getMinutes())
    return `${y}-${mo}-${d}T${h}:${mi}:00${offset}`
}

// "2026-07-28T08:30:00+07:00" -> "2026-07-28T08:30" (local wall-clock)
export function toDatetimeLocalValue(iso: string): string {
    if (!iso) return ''
    const date = new Date(iso)
    if (isNaN(date.getTime())) return ''

    const pad = (n: number) => String(n).padStart(2, '0')
    const y = date.getFullYear()
    const mo = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const mi = pad(date.getMinutes())
    return `${y}-${mo}-${d}T${h}:${mi}`
}
