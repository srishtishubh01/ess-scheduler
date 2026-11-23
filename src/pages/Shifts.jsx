import { useState } from 'react'
import { Plus, Pencil, Trash2, Send, Check, Repeat, CalendarX2 } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, SearchBox, Tabs, Badge, Who, Empty } from '../components/ui'
import ShiftForm from '../components/ShiftForm'
import { SwapForm } from '../components/RequestForms'
import { checkEligibility } from '../lib/rules'
import { today, fmtDate, fmtTime, dayName, hours, MGR } from '../utils'

export default function Shifts() {
  const { db, me, user, patch, del, mutate, notify, alert, alertMgrs, audit } = useStore()
  const isMgr = MGR.includes(me.role)
  const [q, setQ] = useState(''), [dept, setDept] = useState('all'), [st, setSt] = useState('all'), [range, setRange] = useState('upcoming')
  const [tab, setTab] = useState(isMgr ? 'all' : 'mine'), [edit, setEdit] = useState(null), [swap, setSwap] = useState(null), [limit, setLimit] = useState(25)
  const t = today()
  let rows = db.shifts.filter((s) => (range === 'upcoming' ? s.date >= t : range === 'past' ? s.date < t : true))
  if (!isMgr) rows = rows.filter((s) => (tab === 'mine' ? s.assignedTo === me.id : tab === 'open' ? !s.assignedTo && s.status === 'published' : s.status === 'published'))
  if (dept !== 'all') rows = rows.filter((s) => s.dept === dept)
  if (st === 'open') rows = rows.filter((s) => !s.assignedTo)
  else if (st === 'assigned') rows = rows.filter((s) => s.assignedTo)
  else if (st !== 'all') rows = rows.filter((s) => s.status === st)
  if (q) rows = rows.filter((s) => [s.title, s.position, s.location, user(s.assignedTo)?.name].join(' ').toLowerCase().includes(q.toLowerCase()))
  rows = [...rows].sort((a, b) => (range === 'past' ? -1 : 1) * (a.date + a.start).localeCompare(b.date + b.start))
  const drafts = db.shifts.filter((s) => s.status === 'draft' && s.date >= t)

  const publishAll = () => {
    mutate((d) => { d.shifts.forEach((s) => { if (s.status === 'draft' && s.date >= t) s.status = 'published' }); return d })
    drafts.filter((s) => s.assignedTo).forEach((s) => alert(s.assignedTo, 'New shift assigned', `${s.title} on ${fmtDate(s.date)}, ${fmtTime(s.start)}.`, 'shift'))
    audit(`Published ${drafts.length} draft shifts`); notify(`${drafts.length} shifts published`)
  }
  const accept = (s) => { patch('shifts', s.id, { accepted: true }); alertMgrs('Shift accepted', `${me.name} accepted "${s.title}" on ${fmtDate(s.date)}.`); notify('Shift accepted') }
  const claim = (s) => {
    const issues = checkEligibility(db, s, me.id)
    if (issues.length) return notify(`You can't take this shift: ${issues[0]}`, 'err')
    patch('shifts', s.id, { assignedTo: me.id, accepted: true }); alertMgrs('Open shift claimed', `${me.name} claimed "${s.title}" on ${fmtDate(s.date)}.`); notify('Shift added to your schedule')
  }
  const remove = (s) => { if (window.confirm(`Delete "${s.title}" on ${fmtDate(s.date)}?`)) { del('shifts', s.id); audit(`Deleted shift "${s.title}"`); notify('Shift deleted') } }

  return (
    <>
      <PageHead title={isMgr ? 'Shifts' : 'My shifts'} sub={isMgr ? 'Create, assign and publish shifts for your teams.' : 'View assigned shifts, accept them, claim open ones or ask for a swap.'}>
        {isMgr && drafts.length > 0 && <button className="btn" onClick={publishAll}><Send size={15} />Publish drafts ({drafts.length})</button>}
        {isMgr && <button className="btn primary" onClick={() => setEdit({})}><Plus size={15} />Create shift</button>}
      </PageHead>
      <div className="card">
        <div className="toolbar">
          {!isMgr && <Tabs value={tab} onChange={setTab} tabs={[{ id: 'mine', label: 'Mine' }, { id: 'open', label: 'Open shifts' }, { id: 'all', label: 'Everyone' }]} />}
          <SearchBox value={q} onChange={setQ} placeholder="Search shifts or people" />
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"><option value="all">All departments</option>{db.departments.map((d) => <option key={d}>{d}</option>)}</select>
          {isMgr && <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="all">Any status</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="draft">Draft</option><option value="published">Published</option></select>}
          <select className="input" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range"><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All dates</option></select>
        </div>
        {rows.length ? <div className="table-wrap"><table>
          <thead><tr><th>Date</th><th>Shift</th><th>Time</th><th>Assigned to</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>{rows.slice(0, limit).map((s) => (
            <tr key={s.id}>
              <td><b>{fmtDate(s.date)}</b><div className="sub">{dayName(s.date)}{s.date === t && ', today'}</div></td>
              <td><b>{s.title}</b><div className="sub">{s.dept}, {s.location}</div></td>
              <td className="num">{fmtTime(s.start)} to {fmtTime(s.end)}<div className="sub">{hours(s.start, s.end)} hours</div></td>
              <td><Who user={user(s.assignedTo)} /></td>
              <td><div className="row" style={{ gap: 6 }}><Badge>{s.status}</Badge>{!s.assignedTo && <Badge tone="red">Open</Badge>}{s.assignedTo && s.status === 'published' && (s.accepted ? <Badge tone="green">Accepted</Badge> : <Badge tone="amber">Awaiting</Badge>)}</div></td>
              <td><div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                {isMgr ? <>
                  {s.status === 'draft' && <button className="btn sm" onClick={() => { patch('shifts', s.id, { status: 'published' }); notify('Shift published') }}>Publish</button>}
                  <button className="btn icon" aria-label="Edit shift" onClick={() => setEdit(s)}><Pencil size={14} /></button>
                  <button className="btn icon danger" aria-label="Delete shift" onClick={() => remove(s)}><Trash2 size={14} /></button>
                </> : <>
                  {s.assignedTo === me.id && !s.accepted && <button className="btn sm primary" onClick={() => accept(s)}><Check size={13} />Accept</button>}
                  {s.assignedTo === me.id && s.date >= t && <button className="btn sm" onClick={() => setSwap(s.id)}><Repeat size={13} />Swap</button>}
                  {!s.assignedTo && s.date >= t && <button className="btn sm primary" onClick={() => claim(s)}>Claim shift</button>}
                </>}
              </div></td>
            </tr>))}</tbody></table></div>
          : <Empty icon={CalendarX2} title="No shifts match" text={isMgr ? 'Try different filters or create a new shift.' : 'Nothing here yet. Check open shifts or change the date range.'} />}
        {rows.length > limit && <div style={{ padding: 14, textAlign: 'center' }}><button className="btn" onClick={() => setLimit(limit + 25)}>Show more ({rows.length - limit} left)</button></div>}
      </div>
      {edit && <ShiftForm shift={edit.id ? edit : null} onClose={() => setEdit(null)} />}
      {swap && <SwapForm shiftId={swap} onClose={() => setSwap(null)} />}
    </>
  )
}
