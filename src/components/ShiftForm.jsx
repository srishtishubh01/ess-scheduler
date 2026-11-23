import { useState } from 'react'
import { Modal, Field } from './ui'
import { useStore } from '../context/Store'
import { checkEligibility } from '../lib/rules'
import { today, toMin, fmtDate, fmtTime } from '../utils'

const TEMPLATES = [['Opening', '06:00', '14:00'], ['Day', '08:00', '16:00'], ['Mid', '11:00', '19:00'], ['Closing', '14:00', '22:00']]

export default function ShiftForm({ shift, defaults, onClose }) {
  const { db, add, patch, notify, alert, audit } = useStore()
  const [f, setF] = useState(shift || { title: '', date: today(), start: '08:00', end: '16:00', position: '', dept: db.departments[0], location: '', assignedTo: null, status: 'draft', accepted: false, ...defaults })
  const [override, setOverride] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const issues = f.assignedTo ? checkEligibility(db, { ...f, id: shift?.id }, f.assignedTo) : []
  const save = () => {
    if (!f.title.trim() || !f.date) return notify('Add a title and a date', 'err')
    if (toMin(f.end) <= toMin(f.start)) return notify('End time must be after start time', 'err')
    if (issues.length && !override) return notify('Resolve the eligibility conflicts or tick the override', 'err')
    const changed = f.assignedTo !== (shift?.assignedTo ?? null)
    const data = { ...f, assignedTo: f.assignedTo || null, accepted: changed ? false : f.accepted }
    if (shift) { patch('shifts', shift.id, data); audit(`Edited shift "${data.title}"`) } else { add('shifts', data); audit(`Created shift "${data.title}"`) }
    if (data.assignedTo && data.status === 'published' && (changed || !shift)) alert(data.assignedTo, 'New shift assigned', `${data.title}, ${fmtDate(data.date)}, ${fmtTime(data.start)} to ${fmtTime(data.end)}`, 'shift')
    notify(shift ? 'Shift updated' : 'Shift created'); onClose()
  }
  const emps = db.users.filter((u) => u.role === 'employee' && u.status === 'Active')
  return (
    <Modal wide title={shift ? 'Edit shift' : 'Create shift'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>{shift ? 'Save changes' : 'Create shift'}</button></>}>
      <div className="row" style={{ marginBottom: 14 }}><span style={{ color: 'var(--muted)' }}>Templates</span>{TEMPLATES.map(([l, a, b]) => <button key={l} className={'chip' + (f.start === a && f.end === b ? ' on' : '')} onClick={() => setF((p) => ({ ...p, start: a, end: b }))}>{l} {fmtTime(a)} to {fmtTime(b)}</button>)}</div>
      <div className="f2">
        <Field label="Shift title"><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Front desk opening" /></Field>
        <Field label="Date"><input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Start time"><input className="input" type="time" value={f.start} onChange={(e) => set('start', e.target.value)} /></Field>
        <Field label="End time"><input className="input" type="time" value={f.end} onChange={(e) => set('end', e.target.value)} /></Field>
        <Field label="Department"><select className="input" value={f.dept} onChange={(e) => set('dept', e.target.value)}>{db.departments.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Role or position"><input className="input" value={f.position} onChange={(e) => set('position', e.target.value)} placeholder="Receptionist" /></Field>
        <Field label="Location"><input className="input" value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Main lobby" /></Field>
        <Field label="Status"><select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
      </div>
      <Field label="Assign to"><select className="input" value={f.assignedTo || ''} onChange={(e) => { set('assignedTo', e.target.value || null); setOverride(false) }}>
        <option value="">Leave open</option>{emps.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.dept})</option>)}</select></Field>
      {f.assignedTo && (issues.length ? <div className="alertbox"><b>Eligibility check found {issues.length} conflict{issues.length > 1 ? 's' : ''}</b><ul>{issues.map((i) => <li key={i}>{i}</li>)}</ul>
        <label style={{ display: 'flex', gap: 8, marginTop: 8 }}><input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />Assign anyway as manager override</label></div>
        : <div className="alertbox ok">Eligibility check passed. Availability, time off, overlaps and weekly hours are fine.</div>)}
    </Modal>
  )
}
