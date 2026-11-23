import { useState } from 'react'
import { Modal, Field } from './ui'
import { useStore } from '../context/Store'
import { checkEligibility } from '../lib/rules'
import { today, fmtDate, fmtTime } from '../utils'

export function SwapForm({ shiftId, onClose }) {
  const s = useStore()
  const { db, me, add, notify, alertMgrs } = s
  const mine = db.shifts.filter((x) => x.assignedTo === me.id && x.date >= today() && x.status === 'published')
  const [sid, setSid] = useState(shiftId || mine[0]?.id || '')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const shift = db.shifts.find((x) => x.id === sid)
  const peers = db.users.filter((u) => u.role === 'employee' && u.id !== me.id && u.status === 'Active')
  const issues = shift && to ? checkEligibility(db, shift, to) : []
  const save = () => {
    if (!shift || !to) return notify('Choose a shift and a colleague', 'err')
    if (!reason.trim()) return notify('Add a reason for the swap', 'err')
    add('swaps', { shiftId: sid, fromId: me.id, toId: to, reason, status: 'pending', created: new Date().toISOString() })
    alertMgrs('Swap request awaiting approval', `${me.name} asked to swap "${shift.title}" on ${fmtDate(shift.date)}.`)
    notify('Swap request sent for approval'); onClose()
  }
  return (
    <Modal title="Request a shift swap" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Send request</button></>}>
      <Field label="Your shift"><select className="input" value={sid} onChange={(e) => setSid(e.target.value)}>{mine.map((x) => <option key={x.id} value={x.id}>{fmtDate(x.date)}, {fmtTime(x.start)} to {fmtTime(x.end)}, {x.title}</option>)}</select></Field>
      <Field label="Swap with"><select className="input" value={to} onChange={(e) => setTo(e.target.value)}><option value="">Select a colleague</option>{peers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.dept})</option>)}</select></Field>
      {to && (issues.length ? <div className="alertbox"><b>This colleague may not be eligible</b><ul>{issues.map((i) => <li key={i}>{i}</li>)}</ul></div> : <div className="alertbox ok">Your colleague is eligible for this shift.</div>)}
      <Field label="Reason"><textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell your manager why you need a swap" /></Field>
    </Modal>
  )
}

export function TimeOffForm({ onClose }) {
  const { me, add, notify, alertMgrs } = useStore()
  const [f, setF] = useState({ type: 'Paid time off', from: today(), to: today(), reason: '' })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = () => {
    if (f.to < f.from) return notify('End date must be on or after the start date', 'err')
    add('timeoff', { ...f, userId: me.id, status: 'pending', created: new Date().toISOString() })
    alertMgrs('Time-off request awaiting approval', `${me.name} requested ${f.type.toLowerCase()} from ${fmtDate(f.from)} to ${fmtDate(f.to)}.`)
    notify('Time-off request submitted'); onClose()
  }
  return (
    <Modal title="Request time off" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Submit request</button></>}>
      <Field label="Type"><select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}>{['Paid time off', 'Sick leave', 'Personal', 'Unpaid leave'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <div className="f2"><Field label="From"><input className="input" type="date" value={f.from} onChange={(e) => set('from', e.target.value)} /></Field><Field label="To"><input className="input" type="date" value={f.to} onChange={(e) => set('to', e.target.value)} /></Field></div>
      <Field label="Reason"><textarea className="input" rows={3} value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Optional note for your manager" /></Field>
    </Modal>
  )
}
