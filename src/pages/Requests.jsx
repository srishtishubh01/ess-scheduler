import { useState } from 'react'
import { Plus, Check, X, Trash2, Inbox } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Tabs, Badge, Who, Empty } from '../components/ui'
import { SwapForm, TimeOffForm } from '../components/RequestForms'
import { approveSwap } from '../lib/actions'
import { fmtDate, fmtTime, ago, MGR } from '../utils'

export default function Requests() {
  const s = useStore()
  const { db, me, user, patch, del, notify, alert, audit } = s
  const isMgr = MGR.includes(me.role)
  const [tab, setTab] = useState('swaps'), [filter, setFilter] = useState('all'), [form, setForm] = useState(null)
  const canSee = (uid) => isMgr || me.role === 'hr' || uid === me.id
  const swaps = db.swaps.filter((x) => canSee(x.fromId) && (filter === 'all' || x.status === filter))
  const offs = db.timeoff.filter((x) => canSee(x.userId) && (filter === 'all' || x.status === filter))
  const decideOff = (x, status) => { patch('timeoff', x.id, { status }); alert(x.userId, `Time off ${status}`, `${x.type}, ${fmtDate(x.from)} to ${fmtDate(x.to)}, was ${status}.`); audit(`${status === 'approved' ? 'Approved' : 'Rejected'} time-off request`); notify(`Request ${status}`) }
  const rejectSwap = (x) => { patch('swaps', x.id, { status: 'rejected' }); alert(x.fromId, 'Swap rejected', 'Your swap request was not approved.'); notify('Swap rejected') }
  return (
    <>
      <PageHead title="Swaps and time off" sub={isMgr ? 'Review requests and keep the schedule covered.' : 'Request a swap or time off and track approval.'}>
        {me.role === 'employee' && <><button className="btn" onClick={() => setForm('swap')}><Plus size={15} />Request swap</button><button className="btn primary" onClick={() => setForm('off')}><Plus size={15} />Request time off</button></>}
      </PageHead>
      <div className="card">
        <div className="toolbar"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'swaps', label: `Swaps (${swaps.length})` }, { id: 'off', label: `Time off (${offs.length})` }]} />
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Status"><option value="all">Any status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        {tab === 'swaps' ? (swaps.length ? <div className="table-wrap"><table>
          <thead><tr><th>Requested by</th><th>Shift</th><th>Swap with</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>{swaps.map((x) => { const sh = db.shifts.find((y) => y.id === x.shiftId); return (
            <tr key={x.id}><td><Who user={user(x.fromId)} sub={ago(x.created)} /></td>
              <td>{sh ? <><b>{sh.title}</b><div className="sub">{fmtDate(sh.date)}, {fmtTime(sh.start)} to {fmtTime(sh.end)}</div></> : 'Shift removed'}</td>
              <td><Who user={user(x.toId)} /></td><td style={{ maxWidth: 220 }}>{x.reason}</td><td><Badge>{x.status}</Badge></td>
              <td><div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                {x.status === 'pending' && isMgr && <><button className="btn sm primary" onClick={() => approveSwap(s, x)}><Check size={13} />Approve</button><button className="btn sm danger" onClick={() => rejectSwap(x)}><X size={13} />Reject</button></>}
                {x.status === 'pending' && x.fromId === me.id && <button className="btn sm icon danger" aria-label="Cancel request" onClick={() => { del('swaps', x.id); notify('Request cancelled') }}><Trash2 size={13} /></button>}</div></td></tr>) })}</tbody></table></div>
          : <Empty icon={Inbox} title="No swap requests" text="Requests will appear here once submitted." />)
        : (offs.length ? <div className="table-wrap"><table>
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>{offs.map((x) => (
            <tr key={x.id}><td><Who user={user(x.userId)} sub={ago(x.created)} /></td><td>{x.type}</td><td className="num">{fmtDate(x.from)} to {fmtDate(x.to)}</td><td style={{ maxWidth: 220 }}>{x.reason || 'None'}</td><td><Badge>{x.status}</Badge></td>
              <td><div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                {x.status === 'pending' && isMgr && <><button className="btn sm primary" onClick={() => decideOff(x, 'approved')}><Check size={13} />Approve</button><button className="btn sm danger" onClick={() => decideOff(x, 'rejected')}><X size={13} />Reject</button></>}
                {x.status === 'pending' && x.userId === me.id && <button className="btn sm icon danger" aria-label="Cancel request" onClick={() => { del('timeoff', x.id); notify('Request cancelled') }}><Trash2 size={13} /></button>}</div></td></tr>))}</tbody></table></div>
          : <Empty icon={Inbox} title="No time-off requests" text="Requests will appear here once submitted." />)}
      </div>
      {form === 'swap' && <SwapForm onClose={() => setForm(null)} />}
      {form === 'off' && <TimeOffForm onClose={() => setForm(null)} />}
    </>
  )
}
