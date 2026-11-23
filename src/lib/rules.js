import { dayName, toMin, hours, weekStart, addDays, today, nowHM } from '../utils'

// Automated eligibility checking (SRS: availability, time off, overlaps, weekly limits)
export function checkEligibility(db, shift, userId) {
  const u = db.users.find((x) => x.id === userId)
  if (!u) return ['Employee not found']
  const issues = []
  if (u.status !== 'Active') issues.push('Employee account is inactive')
  const day = dayName(shift.date)
  const a = u.availability
  if (!a.days.includes(day)) issues.push(`Not available on ${day}`)
  else if (toMin(shift.start) < toMin(a.from) || toMin(shift.end) > toMin(a.to)) issues.push(`Outside availability window (${a.from} to ${a.to})`)
  if (db.timeoff.some((t) => t.userId === userId && t.status === 'approved' && shift.date >= t.from && shift.date <= t.to)) issues.push('On approved time off')
  const mine = db.shifts.filter((s) => s.id !== shift.id && s.assignedTo === userId)
  if (mine.some((s) => s.date === shift.date && toMin(s.start) < toMin(shift.end) && toMin(shift.start) < toMin(s.end))) issues.push('Overlaps another assigned shift')
  const ws = weekStart(shift.date)
  const wk = mine.filter((s) => s.date >= ws && s.date < addDays(ws, 7)).reduce((n, s) => n + hours(s.start, s.end), 0) + hours(shift.start, shift.end)
  if (wk > a.maxHours) issues.push(`Exceeds weekly limit (${wk}h of ${a.maxHours}h)`)
  if (u.dept !== shift.dept) issues.push(`Belongs to ${u.dept}, not ${shift.dept}`)
  return issues
}

// Attendance reconciliation against scheduled shifts
export function attendanceRows(db) {
  const t = today()
  const grace = db.settings.grace
  return db.shifts
    .filter((s) => s.assignedTo && s.status === 'published' && s.date <= t)
    .map((s) => {
      const rec = db.attendance.find((a) => a.shiftId === s.id)
      const user = db.users.find((u) => u.id === s.assignedTo)
      let status
      if (rec) status = !rec.out && s.date === t ? 'In progress' : toMin(rec.in) > toMin(s.start) + grace ? 'Late' : 'On time'
      else if (s.date < t) status = 'Absent'
      else status = toMin(nowHM()) > toMin(s.start) + grace ? 'Not clocked in' : 'Upcoming'
      const worked = rec && rec.out ? hours(rec.in, rec.out) : 0
      return { shift: s, user, rec, status, worked }
    })
    .sort((a, b) => (b.shift.date + b.shift.start).localeCompare(a.shift.date + a.shift.start))
}
