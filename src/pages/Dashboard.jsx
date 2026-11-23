import { useNavigate } from 'react-router-dom'
import { CalendarClock, AlertTriangle, ArrowLeftRight, Clock, Bell, Timer, CheckCheck, X as XIcon } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Stat, BarChart, Donut, Badge, Who } from '../components/ui'
import { attendanceRows, checkEligibility } from '../lib/rules'
import { today, weekStart, addDays, DAYS, hours, fmtDate, fmtTime, fmtLong, ago, MGR } from '../utils'
import { approveSwap } from '../lib/actions'

export default function Dashboard() {
  const s = useStore()
  const { db, me, user, patch, notify } = s
  const nav = useNavigate()
  const t = today(), ws = weekStart(t), we = addDays(ws, 7)
  const isEmp = me.role === 'employee', isMgr = MGR.includes(me.role)
  const week = db.shifts.filter((x) => x.date >= ws && x.date < we)
  const scope = isEmp ? week.filter((x) => x.assignedTo === me.id) : week
  const byDay = DAYS.map((d, i) => ({ label: d, value: scope.filter((x) => x.date === addDays(ws, i)).reduce((n, x) => n + hours(x.start, x.end), 0), alt: addDays(ws, i) === t }))
  const rows = attendanceRows(db).filter((r) => r.shift.date >= addDays(t, -7) && r.shift.date < t)
  const rate = rows.length ? Math.round((rows.filter((r) => r.status === 'On time' || r.status === 'Late').length / rows.length) * 100) : 100
  const pendSw = db.swaps.filter((x) => x.status === 'pending'), pendTo = db.timeoff.filter((x) => x.status === 'pending')
  const open = db.shifts.filter((x) => !x.assignedTo && x.date >= t)
  const mineNext = db.shifts.filter((x) => x.assignedTo === me.id && x.date >= t && x.status === 'published').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const unread = db.notifications.filter((n) => (n.userId === me.id || n.userId === 'all') && !n.read).length
  const myHours = scope.reduce((n, x) => n + hours(x.start, x.end), 0)
  const depts = db.departments.map((d, i) => ({ label: d, value: week.filter((x) => x.dept === d && x.assignedTo).length, color: ['#0F6B5C', '#2F5D9E', '#8A5A2B', '#6B4C9A'][i % 4] }))
  return (
    <>
      <PageHead title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${me.name.split(' ')[0]}`} sub={fmtLong(t)} />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        {isEmp ? <>
          <Stat icon={CalendarClock} label="Shifts this week" value={scope.length} hint={`${myHours} scheduled hours`} />
          <Stat icon={Timer} label="Next shift" value={mineNext[0] ? fmtDate(mineNext[0].date) : 'None'} hint={mineNext[0] ? `${fmtTime(mineNext[0].start)} at ${mineNext[0].location}` : 'Nothing scheduled'} tone="blue" />
          <Stat icon={ArrowLeftRight} label="Open requests" value={[...db.swaps, ...db.timeoff].filter((x) => (x.fromId || x.userId) === me.id && x.status === 'pending').length} tone="amber" />
          <Stat icon={Bell} label="Unread alerts" value={unread} tone="red" />
        </> : <>
          <Stat icon={CalendarClock} label="Shifts this week" value={week.length} hint={`${week.reduce((n, x) => n + hours(x.start, x.end), 0)} scheduled hours`} />
          <Stat icon={AlertTriangle} label="Open shifts" value={open.length} hint="Need an assignee" tone="red" />
          <Stat icon={ArrowLeftRight} label="Pending approvals" value={pendSw.length + pendTo.length} hint={`${pendSw.length} swaps, ${pendTo.length} time off`} tone="amber" />
          <Stat icon={Clock} label="Attendance, last 7 days" value={rate + '%'} hint={`${rows.filter((r) => r.status === 'Late').length} late, ${rows.filter((r) => r.status === 'Absent').length} absent`} tone="blue" />
        </>}
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card"><div className="card-h"><h3>{isEmp ? 'My hours this week' : 'Scheduled hours this week'}</h3></div><div className="card-b"><BarChart data={byDay} format={(v) => v + 'h'} /></div></div>
        <div className="card"><div className="card-h"><h3>Coverage by department</h3></div><div className="card-b"><Donut data={depts} /></div></div>
      </div>
      <div className="grid g2">
        <div className="card"><div className="card-h"><h3>{isEmp ? 'Upcoming shifts' : 'Open shifts to fill'}</h3><button className="btn sm" onClick={() => nav('/shifts')}>View all</button></div>
          <div className="card-b list">
            {(isEmp ? mineNext : open).slice(0, 5).map((x) => (
              <div key={x.id}><div className="grow"><b>{x.title}</b><small>{fmtDate(x.date)}, {fmtTime(x.start)} to {fmtTime(x.end)} at {x.location}</small></div><Badge>{x.dept}</Badge></div>
            ))}
            {!(isEmp ? mineNext : open).length && <small>Nothing to show right now.</small>}
          </div></div>
        <div className="card"><div className="card-h"><h3>{isMgr ? 'Awaiting your approval' : 'Recent activity'}</h3></div>
          <div className="card-b list">
            {isMgr ? <>
              {pendSw.slice(0, 3).map((x) => (
                <div key={x.id}><div className="grow"><b>Swap: {user(x.fromId)?.name} to {user(x.toId)?.name}</b><small>{x.reason}</small></div>
                  <button className="btn sm icon" aria-label="Approve" onClick={() => approveSwap(s, x)}><CheckCheck size={14} /></button>
                  <button className="btn sm icon danger" aria-label="Reject" onClick={() => { patch('swaps', x.id, { status: 'rejected' }); notify('Swap rejected') }}><XIcon size={14} /></button></div>))}
              {pendTo.slice(0, 3).map((x) => (
                <div key={x.id}><div className="grow"><b>{x.type}: {user(x.userId)?.name}</b><small>{fmtDate(x.from)} to {fmtDate(x.to)}</small></div>
                  <button className="btn sm icon" aria-label="Approve" onClick={() => { patch('timeoff', x.id, { status: 'approved' }); s.alert(x.userId, 'Time off approved', `${fmtDate(x.from)} to ${fmtDate(x.to)} was approved.`); notify('Time off approved') }}><CheckCheck size={14} /></button>
                  <button className="btn sm icon danger" aria-label="Reject" onClick={() => { patch('timeoff', x.id, { status: 'rejected' }); s.alert(x.userId, 'Time off declined', `${fmtDate(x.from)} to ${fmtDate(x.to)} was declined.`); notify('Time off rejected') }}><XIcon size={14} /></button></div>))}
              {!pendSw.length && !pendTo.length && <small>You are all caught up.</small>}
            </> : db.audit.slice(0, 5).map((a) => <div key={a.id}><div className="grow"><b>{a.text}</b><small>{a.by}, {ago(a.time)}</small></div></div>)}
          </div></div>
      </div>
    </>
  )
}
