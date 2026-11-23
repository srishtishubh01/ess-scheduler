import { useEffect, useState } from 'react'
import { LogIn, LogOut, Pencil, Clock as ClockIcon } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, SearchBox, Badge, Who, Modal, Field, Empty } from '../components/ui'
import { attendanceRows } from '../lib/rules'
import { today, nowHM, fmtDate, fmtTime, MGR } from '../utils'

export default function Attendance() {
  const { db, me, add, patch, notify, audit } = useStore()
  const isMgr = MGR.includes(me.role)
  const [q, setQ] = useState(''), [st, setSt] = useState('all'), [edit, setEdit] = useState(null), [tick, setTick] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(i) }, [])
  const all = attendanceRows(db)
  const rows = all.filter((r) => (me.role === 'employee' ? r.user.id === me.id : true) && (st === 'all' || r.status === st) && r.user.name.toLowerCase().includes(q.toLowerCase()))
  const mine = all.find((r) => r.user.id === me.id && r.shift.date === today())
  const clockIn = () => { add('attendance', { userId: me.id, shiftId: mine.shift.id, date: today(), in: nowHM(), out: '' }); notify('Clocked in. Have a good shift') }
  const clockOut = () => { patch('attendance', mine.rec.id, { out: nowHM() }); notify('Clocked out') }
  const saveEdit = () => {
    if (edit.rec) patch('attendance', edit.rec.id, { in: edit.in, out: edit.out })
    else add('attendance', { userId: edit.user.id, shiftId: edit.shift.id, date: edit.shift.date, in: edit.in, out: edit.out })
    audit(`Corrected attendance for ${edit.user.name}`); notify('Attendance updated'); setEdit(null)
  }
  return (
    <>
      <PageHead title="Attendance" sub="Clock-in and clock-out records reconciled against scheduled shifts." />
      {me.role === 'employee' && <div className="card clock" style={{ marginBottom: 16 }}>
        <div><div className="time">{tick.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div><span style={{ color: 'var(--muted)' }}>{tick.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
        <div style={{ flex: 1, minWidth: 220 }}>{mine ? <><b>{mine.shift.title}</b><div style={{ color: 'var(--muted)' }}>{fmtTime(mine.shift.start)} to {fmtTime(mine.shift.end)} at {mine.shift.location}</div>
          {mine.rec && <div style={{ marginTop: 4 }}>Clocked in at {fmtTime(mine.rec.in)}{mine.rec.out && `, out at ${fmtTime(mine.rec.out)}`}</div>}</> : <span style={{ color: 'var(--muted)' }}>You have no published shift today.</span>}</div>
        {mine && !mine.rec && <button className="btn primary" onClick={clockIn}><LogIn size={16} />Clock in</button>}
        {mine && mine.rec && !mine.rec.out && <button className="btn primary" onClick={clockOut}><LogOut size={16} />Clock out</button>}
      </div>}
      <div className="card">
        <div className="toolbar">{me.role !== 'employee' && <SearchBox value={q} onChange={setQ} placeholder="Search employees" />}
          <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="all">Any status</option>{['On time', 'Late', 'Absent', 'In progress', 'Not clocked in'].map((x) => <option key={x}>{x}</option>)}</select></div>
        {rows.length ? <div className="table-wrap"><table>
          <thead><tr><th>Employee</th><th>Date</th><th>Scheduled</th><th>Clock in</th><th>Clock out</th><th>Worked</th><th>Status</th>{isMgr && <th />}</tr></thead>
          <tbody>{rows.slice(0, 40).map((r) => (
            <tr key={r.shift.id}><td><Who user={r.user} sub={r.shift.title} /></td><td>{fmtDate(r.shift.date)}</td><td className="num">{fmtTime(r.shift.start)} to {fmtTime(r.shift.end)}</td>
              <td className="num">{r.rec ? fmtTime(r.rec.in) : 'None'}</td><td className="num">{r.rec && r.rec.out ? fmtTime(r.rec.out) : 'None'}</td><td className="num">{r.worked ? r.worked.toFixed(1) + 'h' : 'None'}</td><td><Badge>{r.status}</Badge></td>
              {isMgr && <td><button className="btn sm icon" aria-label="Correct attendance" onClick={() => setEdit({ ...r, in: r.rec?.in || r.shift.start, out: r.rec?.out || r.shift.end })}><Pencil size={13} /></button></td>}</tr>))}</tbody></table></div>
          : <Empty icon={ClockIcon} title="No attendance records" text="Records appear after published shifts begin." />}
      </div>
      {edit && <Modal title="Correct attendance" onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" onClick={saveEdit}>Save correction</button></>}>
        <p style={{ marginBottom: 14, color: 'var(--muted)' }}>{edit.user.name}, {edit.shift.title}, {fmtDate(edit.shift.date)}</p>
        <div className="f2"><Field label="Clock in"><input className="input" type="time" value={edit.in} onChange={(e) => setEdit({ ...edit, in: e.target.value })} /></Field><Field label="Clock out"><input className="input" type="time" value={edit.out} onChange={(e) => setEdit({ ...edit, out: e.target.value })} /></Field></div>
      </Modal>}
    </>
  )
}
