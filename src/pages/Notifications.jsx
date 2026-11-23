import { useState } from 'react'
import { Bell, CheckCheck, Megaphone, Trash2 } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Tabs, Modal, Field, Empty } from '../components/ui'
import { ago, MGR } from '../utils'

export default function Notifications() {
  const { db, me, mutate, alert, notify } = useStore()
  const [tab, setTab] = useState('all'), [compose, setCompose] = useState(null)
  const mine = db.notifications.filter((n) => n.userId === me.id || n.userId === 'all')
  const rows = mine.filter((n) => tab === 'all' || !n.read)
  const markAll = () => mutate((d) => { d.notifications.forEach((n) => { if (n.userId === me.id || n.userId === 'all') n.read = true }); return d })
  const send = () => { if (!compose.title.trim() || !compose.body.trim()) return notify('Add a title and a message', 'err'); alert(compose.to, compose.title, compose.body, 'info'); notify('Alert sent'); setCompose(null) }
  return (
    <>
      <PageHead title="Notifications" sub="Shift reminders, schedule changes and approval outcomes.">
        <button className="btn" onClick={markAll}><CheckCheck size={15} />Mark all as read</button>
        {MGR.includes(me.role) && <button className="btn primary" onClick={() => setCompose({ to: 'all', title: '', body: '' })}><Megaphone size={15} />Send alert</button>}
      </PageHead>
      <div className="card"><div className="toolbar"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: `All (${mine.length})` }, { id: 'unread', label: `Unread (${mine.filter((n) => !n.read).length})` }]} /></div>
        {rows.length ? <div className="card-b list">{rows.map((n) => (
          <div key={n.id} className={n.read ? '' : 'unread'} style={{ paddingLeft: n.read ? 0 : 12 }}>
            <div className="grow"><b>{n.title}</b><small style={{ color: 'var(--ink)' }}>{n.body}</small><small>{ago(n.time)}{n.userId === 'all' && ', sent to everyone'}</small></div>
            {!n.read && <button className="btn sm" onClick={() => mutate((d) => { d.notifications.find((x) => x.id === n.id).read = true; return d })}>Mark read</button>}
            {n.userId === me.id && <button className="btn sm icon danger" aria-label="Delete notification" onClick={() => mutate((d) => { d.notifications = d.notifications.filter((x) => x.id !== n.id); return d })}><Trash2 size={13} /></button>}
          </div>))}</div> : <Empty icon={Bell} title="You are all caught up" text="New alerts will show up here." />}</div>
      {compose && <Modal title="Send an alert" onClose={() => setCompose(null)} footer={<><button className="btn" onClick={() => setCompose(null)}>Cancel</button><button className="btn primary" onClick={send}>Send alert</button></>}>
        <Field label="Send to"><select className="input" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })}><option value="all">Everyone</option>{db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Title"><input className="input" value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} /></Field>
        <Field label="Message"><textarea className="input" rows={4} value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} /></Field>
      </Modal>}
    </>
  )
}
