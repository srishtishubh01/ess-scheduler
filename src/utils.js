export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MGR = ['admin', 'manager']
export const uid = (p) => p + Math.random().toString(36).slice(2, 8)
export const iso = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
export const parse = (s) => new Date(s + 'T00:00:00')
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d) }
export const today = () => iso(new Date())
export const weekStart = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d) }
export const dayName = (s) => DAYS[(parse(s).getDay() + 6) % 7]
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const hours = (s, e) => Math.max(0, (toMin(e) - toMin(s)) / 60)
export const fmtDate = (s) => parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const fmtLong = (s) => parse(s).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
export const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }
export const ago = (s) => { const m = Math.round((Date.now() - new Date(s)) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; if (m < 1440) return Math.round(m / 60) + 'h ago'; return Math.round(m / 1440) + 'd ago' }
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('')
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export const downloadCSV = (name, rows) => {
  const body = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }))
  a.download = name
  a.click()
}
