import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead } from '../components/ui'
import ShiftForm from '../components/ShiftForm'
import { Avatar } from '../components/ui'
import { today, weekStart, addDays, DAYS, fmtDate, fmtTime, hours, MGR } from '../utils'

const DC = { 'Front Desk': '#0F6B5C', Kitchen: '#8A5A2B', Warehouse: '#2F5D9E', Support: '#6B4C9A' }

export default function Schedule() {
  const { db, me } = useStore()
  const isMgr = MGR.includes(me.role)
  const [ws, setWs] = useState(weekStart(today()))
  const [dept, setDept] = useState('all')
  const [edit, setEdit] = useState(null)
  const days = DAYS.map((_, i) => addDays(ws, i))
  const people = db.users.filter((u) => u.role === 'employee' && u.status === 'Active' && (dept === 'all' || u.dept === dept))
  const shiftsOf = (uid, d) => db.shifts.filter((s) => s.assignedTo === uid && s.date === d && (isMgr || s.status === 'published'))
  const openOf = (d) => db.shifts.filter((s) => !s.assignedTo && s.date === d && (dept === 'all' || s.dept === dept) && (isMgr || s.status === 'published'))
  const Block = ({ s }) => (
    <button className={'block' + (s.status === 'draft' ? ' draft' : '') + (!s.assignedTo ? ' open' : '')} style={{ '--c': DC[s.dept] }} onClick={() => isMgr && setEdit(s)} title={s.title}>
      <b>{fmtTime(s.start).replace(':00', '')} to {fmtTime(s.end).replace(':00', '')}</b>{s.title}{s.status === 'draft' && ' (draft)'}
    </button>
  )
  return (
    <>
      <PageHead title="Schedule" sub={`Week of ${fmtDate(ws)} to ${fmtDate(addDays(ws, 6))}`}>
        <select className="input" style={{ width: 'auto' }} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"><option value="all">All departments</option>{db.departments.map((d) => <option key={d}>{d}</option>)}</select>
        <button className="btn icon" onClick={() => setWs(addDays(ws, -7))} aria-label="Previous week"><ChevronLeft size={16} /></button>
        <button className="btn" onClick={() => setWs(weekStart(today()))}>This week</button>
        <button className="btn icon" onClick={() => setWs(addDays(ws, 7))} aria-label="Next week"><ChevronRight size={16} /></button>
        {isMgr && <button className="btn primary" onClick={() => setEdit({ new: true })}><Plus size={15} />Add shift</button>}
      </PageHead>
      <div className="row" style={{ marginBottom: 12, gap: 16 }}>{Object.entries(DC).map(([k, c]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{k}</span>)}</div>
      <div className="card roster"><table>
        <thead><tr><th>Employee</th>{days.map((d, i) => <th key={d} className={d === today() ? 'today' : ''}>{DAYS[i]} {fmtDate(d)}</th>)}<th>Hours</th></tr></thead>
        <tbody>
          {people.map((u) => {
            const total = days.reduce((n, d) => n + shiftsOf(u.id, d).reduce((m, s) => m + hours(s.start, s.end), 0), 0)
            return (
              <tr key={u.id} className={u.id === me.id ? 'me-row' : ''}>
                <td><div className="who"><Avatar user={u} size={28} /><div><b>{u.name}</b><span>{u.dept}</span></div></div></td>
                {days.map((d) => <td key={d}>{shiftsOf(u.id, d).map((s) => <Block key={s.id} s={s} />)}</td>)}
                <td className="num"><b>{total}h</b><div className="sub">of {u.availability.maxHours}h</div></td>
              </tr>)
          })}
          <tr><td><b>Open shifts</b><div className="sub">Need an assignee</div></td>{days.map((d) => <td key={d}>{openOf(d).map((s) => <Block key={s.id} s={s} />)}</td>)}<td /></tr>
        </tbody></table></div>
      {edit && <ShiftForm shift={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  )
}
