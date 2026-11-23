import { useState } from 'react'
import { Download, Printer, Clock, IndianRupee, Timer, AlertTriangle } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Stat, BarChart, Donut, Who } from '../components/ui'
import { attendanceRows } from '../lib/rules'
import { today, addDays, hours, inr, downloadCSV, weekStart } from '../utils'

export default function Reports() {
  const { db } = useStore()
  const [days, setDays] = useState(14)
  const t = today(), from = addDays(t, -days)
  const rows = attendanceRows(db).filter((r) => r.shift.date >= from && r.shift.date < t)
  const emps = db.users.filter((u) => u.role === 'employee')
  const stats = emps.map((u) => {
    const r = rows.filter((x) => x.user.id === u.id)
    const sched = r.reduce((n, x) => n + hours(x.shift.start, x.shift.end), 0), worked = r.reduce((n, x) => n + x.worked, 0)
    return { u, shifts: r.length, sched, worked, late: r.filter((x) => x.status === 'Late').length, absent: r.filter((x) => x.status === 'Absent').length, cost: worked * u.rate }
  })
  const deptCost = db.departments.map((d) => ({ label: d, value: Math.round(stats.filter((s) => s.u.dept === d).reduce((n, s) => n + s.cost, 0)) }))
  const cnt = (s) => rows.filter((r) => r.status === s).length
  const worked = stats.reduce((n, s) => n + s.worked, 0), cost = stats.reduce((n, s) => n + s.cost, 0)
  const rate = rows.length ? Math.round(((rows.length - cnt('Absent')) / rows.length) * 100) : 100
  const ws = weekStart(t)
  const over = emps.map((u) => ({ u, h: db.shifts.filter((s) => s.assignedTo === u.id && s.date >= ws && s.date < addDays(ws, 7)).reduce((n, s) => n + hours(s.start, s.end), 0) })).filter((x) => x.h > db.settings.overtime * 0.8)
  const exportCsv = () => downloadCSV(`rostra-report-${t}.csv`, [['Employee', 'Department', 'Shifts', 'Scheduled hours', 'Worked hours', 'Late', 'Absent', 'Labour cost (INR)'], ...stats.map((s) => [s.u.name, s.u.dept, s.shifts, s.sched, s.worked.toFixed(1), s.late, s.absent, Math.round(s.cost)])])
  return (
    <>
      <PageHead title="Reports" sub="Attendance, participation and labour cost for the selected period.">
        <select className="input no-print" style={{ width: 'auto' }} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period"><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={21}>Last 21 days</option></select>
        <button className="btn no-print" onClick={() => window.print()}><Printer size={15} />Print</button>
        <button className="btn primary no-print" onClick={exportCsv}><Download size={15} />Export CSV</button>
      </PageHead>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Stat icon={Clock} label="Attendance rate" value={rate + '%'} hint={`${rows.length} shifts reviewed`} />
        <Stat icon={Timer} label="Hours worked" value={Math.round(worked)} hint="From clock records" tone="blue" />
        <Stat icon={IndianRupee} label="Labour cost" value={inr(cost)} hint="Worked hours at hourly rate" tone="amber" />
        <Stat icon={AlertTriangle} label="Late arrivals" value={cnt('Late')} hint={`${cnt('Absent')} absences`} tone="red" />
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card"><div className="card-h"><h3>Labour cost by department</h3></div><div className="card-b"><BarChart data={deptCost} format={(v) => inr(v / 1000).replace(/,.*/, '') + 'k'} /></div></div>
        <div className="card"><div className="card-h"><h3>Attendance mix</h3></div><div className="card-b"><Donut data={[{ label: 'On time', value: cnt('On time'), color: '#2C7A3F' }, { label: 'Late', value: cnt('Late'), color: '#C48A10' }, { label: 'Absent', value: cnt('Absent'), color: '#B0413E' }]} /></div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}><div className="card-h"><h3>Employee-wise statistics</h3></div><div className="table-wrap" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Employee</th><th>Shifts</th><th>Scheduled</th><th>Worked</th><th>Late</th><th>Absent</th><th>Labour cost</th></tr></thead>
        <tbody>{stats.map((s) => <tr key={s.u.id}><td><Who user={s.u} sub={s.u.dept} /></td><td className="num">{s.shifts}</td><td className="num">{s.sched}h</td><td className="num">{s.worked.toFixed(1)}h</td><td className="num">{s.late}</td><td className="num">{s.absent}</td><td className="num">{inr(s.cost)}</td></tr>)}</tbody></table></div></div>
      <div className="card"><div className="card-h"><h3>Working-hour compliance this week</h3></div><div className="card-b list">
        {over.length ? over.map((o) => <div key={o.u.id}><div className="grow"><b>{o.u.name}</b><small>{o.h} scheduled hours against a limit of {db.settings.overtime}</small></div><span className={'badge ' + (o.h > db.settings.overtime ? 'red' : 'amber')}>{o.h > db.settings.overtime ? 'Over limit' : 'Near limit'}</span></div>) : <small>Everyone is comfortably within the weekly limit.</small>}</div></div>
    </>
  )
}
