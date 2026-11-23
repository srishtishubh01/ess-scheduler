import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarClock, CalendarDays, ArrowLeftRight, UserCheck, Clock, BarChart3, Users, Bell, Settings, LogOut, Menu, CalendarRange, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useStore } from '../context/Store'
import { Avatar } from './ui'

const ALL = ['admin', 'manager', 'hr', 'employee']
export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/shifts', label: 'Shifts', icon: CalendarClock, roles: ALL },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, roles: ALL },
  { to: '/requests', label: 'Swaps and time off', icon: ArrowLeftRight, roles: ALL },
  { to: '/availability', label: 'Availability', icon: UserCheck, roles: ALL },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: ALL },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'hr'] },
  { to: '/users', label: 'Users and roles', icon: Users, roles: ['admin', 'hr'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ALL },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ALL },
]

export default function Layout() {
  const { db, me, logout, toast } = useStore()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const nav = useNavigate()
  const unread = db.notifications.filter((n) => (n.userId === me.id || n.userId === 'all') && !n.read).length
  const cur = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  return (
    <div className="app">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand"><i><CalendarRange size={17} color="#fff" /></i><div>Rostra<small>{db.settings.org}</small></div></div>
        <nav className="nav" onClick={() => setOpen(false)}>
          {NAV.filter((n) => n.roles.includes(me.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}><n.icon size={18} />{n.label}{n.to === '/notifications' && unread > 0 && <span className="count">{unread}</span>}</NavLink>
          ))}
        </nav>
        <div className="side-foot"><Avatar user={me} size={34} /><div style={{ flex: 1, minWidth: 0 }}><b>{me.name}</b><span>{me.role}</span></div>
          <button className="btn icon" style={{ background: 'transparent', color: '#B4C3CC', borderColor: '#2A3F4C' }} onClick={() => { logout(); nav('/login') }} aria-label="Sign out"><LogOut size={16} /></button></div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="btn icon menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={17} /></button>
          <h2>{cur ? cur.label : 'Rostra'}</h2><div className="sp" />
          <button className="btn icon" onClick={() => nav('/notifications')} aria-label="Notifications" style={{ position: 'relative' }}><Bell size={16} />{unread > 0 && <span style={{ position: 'absolute', top: 5, right: 6, width: 8, height: 8, borderRadius: 4, background: 'var(--red)' }} />}</button>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      {toast && <div className={'toast' + (toast.type === 'err' ? ' err' : '')} role="status">{toast.type === 'err' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}{toast.msg}</div>}
    </div>
  )
}
