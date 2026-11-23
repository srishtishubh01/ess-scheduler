import { useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { initials } from '../utils'

export const Avatar = ({ user, size = 32 }) =>
  user ? <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: user.color }}>{initials(user.name)}</span>
       : <span className="avatar ghost" style={{ width: size, height: size, fontSize: size * 0.4 }}>?</span>

export const Who = ({ user, sub }) => (
  <div className="who"><Avatar user={user} /><div><b>{user ? user.name : 'Unassigned'}</b><span>{sub ?? (user ? user.position : 'Open shift')}</span></div></div>
)

const TONES = { published: 'teal', draft: 'gray', approved: 'green', pending: 'amber', rejected: 'red', 'on time': 'green', late: 'amber', absent: 'red', 'in progress': 'blue', upcoming: 'gray', 'not clocked in': 'red', Active: 'green', Inactive: 'gray', admin: 'blue', manager: 'teal', hr: 'amber', employee: 'gray' }
export const Badge = ({ children, tone }) => <span className={'badge ' + (tone || TONES[children] || TONES[String(children).toLowerCase()] || '')}>{children}</span>

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h"><h3>{title}</h3><button className="btn icon" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  )
}

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row">{children}</div></div>
)
export const Field = ({ label, children }) => <div className="field"><label>{label}</label>{children}</div>
export const SearchBox = ({ value, onChange, placeholder = 'Search' }) => (
  <div className="search"><Search size={15} /><input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>
)
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">{tabs.map((t) => <button key={t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>
)
export const Empty = ({ icon: Icon, title, text }) => <div className="empty">{Icon && <Icon size={30} />}<b>{title}</b><span>{text}</span></div>
export const Stat = ({ icon: Icon, label, value, hint, tone = '' }) => (
  <div className="card stat"><div className={'ic ' + tone}><Icon size={19} /></div><div><b>{value}</b><span>{label}</span>{hint && <small>{hint}</small>}</div></div>
)
export const Switch = ({ on, onChange, label }) => <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />

export function BarChart({ data, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bars">{data.map((d) => (
      <div className="bar" key={d.label}><b>{format(d.value)}</b><div className={d.alt ? 'alt' : ''} style={{ height: (d.value / max) * 78 + '%' }} /><span>{d.label}</span></div>
    ))}</div>
  )
}
export function Donut({ data, size = 130 }) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1
  let acc = 0
  const R = 48, C = 2 * Math.PI * R
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Distribution chart">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#EDF0F2" strokeWidth="16" />
        {data.map((d) => { const len = (d.value / total) * C; const el = <circle key={d.label} cx="60" cy="60" r={R} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 60 60)" />; acc += len; return el })}
        <text x="60" y="64" textAnchor="middle" fontSize="18" fontWeight="700" fill="#12212B">{total === 1 && !data.some((d) => d.value) ? 0 : total}</text>
      </svg>
      <div className="legend">{data.map((d) => <span key={d.label}><i style={{ background: d.color }} />{d.label} <b>{d.value}</b></span>)}</div>
    </div>
  )
}
