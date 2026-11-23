import { useState } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, Tabs, Field, Switch, Badge } from '../components/ui'
import { ago, MGR } from '../utils'

export default function Settings() {
  const { db, me, patch, mutate, notify, audit, reset } = useStore()
  const [tab, setTab] = useState('profile')
  const [p, setP] = useState({ name: me.name, phone: me.phone })
  const [pw, setPw] = useState({ cur: '', next: '' })
  const isAdmin = me.role === 'admin'
  const setS = (k, v) => mutate((d) => { d.settings[k] = v; return d })
  const tabs = [{ id: 'profile', label: 'Profile' }, { id: 'integrations', label: 'Integrations' }, { id: 'security', label: 'Security and audit' }, ...(MGR.includes(me.role) ? [{ id: 'org', label: 'Organization' }] : [])]
  const changePw = () => {
    if (pw.cur !== me.password) return notify('Current password is incorrect', 'err')
    if (pw.next.length < 6) return notify('Use at least 6 characters', 'err')
    patch('users', me.id, { password: pw.next }); setPw({ cur: '', next: '' }); notify('Password updated')
  }
  return (
    <>
      <PageHead title="Settings"><Tabs tabs={tabs} value={tab} onChange={setTab} /></PageHead>
      {tab === 'profile' && <div className="grid g2"><div className="card"><div className="card-h"><h3>Your profile</h3></div><div className="card-b">
        <Field label="Full name"><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
        <Field label="Email"><input className="input" value={me.email} disabled /></Field>
        <button className="btn primary" onClick={() => { if (!p.name.trim()) return notify('Name is required', 'err'); patch('users', me.id, p); notify('Profile saved') }}>Save profile</button></div></div>
        <div className="card"><div className="card-h"><h3>Change password</h3></div><div className="card-b">
          <Field label="Current password"><input className="input" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></Field>
          <Field label="New password"><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <button className="btn primary" onClick={changePw}>Update password</button></div></div></div>}
      {tab === 'integrations' && <div className="card"><div className="card-b">{db.integrations.map((i) => (
        <div className="set-row" key={i.id}><div><b>{i.name}</b> {i.connected ? <Badge tone="green">Connected</Badge> : <Badge>Not connected</Badge>}<p>{i.desc}{i.last && ` Last sync ${ago(i.last)}.`}</p></div>
          <div className="row">{i.connected && <button className="btn sm" onClick={() => { mutate((d) => { d.integrations.find((x) => x.id === i.id).last = new Date().toISOString(); return d }); notify(`${i.name} synced`) }}><RefreshCw size={13} />Sync now</button>}
            <button className={'btn sm' + (i.connected ? ' danger' : ' primary')} disabled={!isAdmin} title={isAdmin ? '' : 'Only administrators can change integrations'} onClick={() => { mutate((d) => { const x = d.integrations.find((y) => y.id === i.id); x.connected = !x.connected; x.last = x.connected ? new Date().toISOString() : null; return d }); audit(`${i.connected ? 'Disconnected' : 'Connected'} ${i.name}`); notify(i.connected ? 'Disconnected' : 'Connected') }}>{i.connected ? 'Disconnect' : 'Connect'}</button></div></div>))}</div></div>}
      {tab === 'security' && <div className="grid g2"><div className="card"><div className="card-h"><h3>Security controls</h3></div><div className="card-b">
        <div className="set-row"><div><b>Two-step verification</b><p>Ask for a code when signing in.</p></div><Switch on={db.settings.twoFA} label="Two-step verification" onChange={(v) => { if (!isAdmin) return notify('Only administrators can change this', 'err'); setS('twoFA', v); audit(`Two-step verification ${v ? 'enabled' : 'disabled'}`) }} /></div>
        <div className="set-row"><div><b>Session timeout</b><p>Sign out inactive users automatically.</p></div><select className="input" style={{ width: 110 }} value={db.settings.timeout} disabled={!isAdmin} onChange={(e) => setS('timeout', Number(e.target.value))}>{[15, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></div>
        <div className="set-row"><div><b>Data protection</b><p>Role-based access control, encrypted transport and access limited to authorized users.</p></div><Badge tone="green">Enforced</Badge></div>
        {isAdmin && <div className="set-row"><div><b>Reset demo data</b><p>Restore the original sample roster and sign out.</p></div><button className="btn danger" onClick={() => { if (window.confirm('Reset all demo data?')) reset() }}><RotateCcw size={14} />Reset</button></div>}</div></div>
        <div className="card"><div className="card-h"><h3>Audit log</h3></div><div className="card-b list">{db.audit.slice(0, 8).map((a) => <div key={a.id}><div className="grow"><b>{a.text}</b><small>{a.by}, {ago(a.time)}</small></div></div>)}</div></div></div>}
      {tab === 'org' && <div className="card" style={{ maxWidth: 640 }}><div className="card-h"><h3>Organization rules</h3></div><div className="card-b">
        <Field label="Organization name"><input className="input" value={db.settings.org} onChange={(e) => setS('org', e.target.value)} /></Field>
        <div className="f2"><Field label="Weekly overtime threshold (hours)"><input className="input" type="number" min="20" max="60" value={db.settings.overtime} onChange={(e) => setS('overtime', Number(e.target.value))} /></Field>
          <Field label="Late grace period (minutes)"><input className="input" type="number" min="0" max="60" value={db.settings.grace} onChange={(e) => setS('grace', Number(e.target.value))} /></Field></div>
        <Field label="Time zone"><select className="input" value={db.settings.timezone} onChange={(e) => setS('timezone', e.target.value)}>{['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York'].map((z) => <option key={z}>{z}</option>)}</select></Field>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Changes save automatically and apply to attendance and compliance checks.</p></div></div>}
    </>
  )
}
