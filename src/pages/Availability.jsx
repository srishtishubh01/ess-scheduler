import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Modal, Field, Who, SearchBox } from '../components/ui'
import { DAYS, fmtTime, MGR } from '../utils'

export default function Availability() {
  const { db, me, patch, notify, audit } = useStore()
  const [q, setQ] = useState(''), [edit, setEdit] = useState(null), [f, setF] = useState(null)
  const people = db.users.filter((u) => u.role === 'employee' && (me.role === 'employee' ? u.id === me.id : true) && u.name.toLowerCase().includes(q.toLowerCase()))
  const open = (u) => { setEdit(u); setF(structuredClone(u.availability)) }
  const toggle = (d) => setF((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] }))
  const save = () => {
    if (f.from >= f.to) return notify('Available-to time must be after available-from', 'err')
    patch('users', edit.id, { availability: { ...f, maxHours: Number(f.maxHours) || 40 } }); audit(`Updated availability for ${edit.name}`); notify('Availability saved'); setEdit(null)
  }
  return (
    <>
      <PageHead title="Availability" sub="Eligibility checks use these days, hours and weekly limits when shifts are assigned.">{me.role !== 'employee' && <SearchBox value={q} onChange={setQ} placeholder="Search employees" />}</PageHead>
      <div className="grid g3">{people.map((u) => (
        <div className="card" key={u.id}><div className="card-h"><Who user={u} sub={u.dept} />{(u.id === me.id || MGR.includes(me.role)) && <button className="btn sm" onClick={() => open(u)}><Pencil size={13} />Edit</button>}</div>
          <div className="card-b"><div className="day-pills" style={{ pointerEvents: 'none' }}>{DAYS.map((d) => <button key={d} className={u.availability.days.includes(d) ? 'on' : ''} tabIndex={-1}>{d}</button>)}</div>
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>{fmtTime(u.availability.from)} to {fmtTime(u.availability.to)}, up to {u.availability.maxHours} hours a week</p></div></div>))}</div>
      {edit && <Modal title={`Availability for ${edit.name}`} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" onClick={save}>Save availability</button></>}>
        <Field label="Days available"><div className="day-pills">{DAYS.map((d) => <button key={d} type="button" className={f.days.includes(d) ? 'on' : ''} onClick={() => toggle(d)}>{d}</button>)}</div></Field>
        <div className="f2"><Field label="Available from"><input className="input" type="time" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field><Field label="Available until"><input className="input" type="time" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field></div>
        <Field label="Maximum hours per week"><input className="input" type="number" min="4" max="60" value={f.maxHours} onChange={(e) => setF({ ...f, maxHours: e.target.value })} /></Field>
      </Modal>}
    </>
  )
}
