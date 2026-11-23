import { createContext, useContext, useEffect, useState } from 'react'
import { seed } from '../data/seed'
import { uid } from '../utils'

const Ctx = createContext(null)
const KEY = 'ess-rostra-v1'
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.users) return s } catch { /* ignore */ } return seed() }

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load)
  const [toast, setToast] = useState(null)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)) }, [db])

  const me = db.users.find((u) => u.id === db.session) || null
  const user = (id) => db.users.find((u) => u.id === id)
  const mutate = (fn) => setDb((d) => fn(structuredClone(d)))
  const notify = (msg, type = 'ok') => { const k = Date.now(); setToast({ msg, type, k }); setTimeout(() => setToast((t) => (t && t.k === k ? null : t)), 2800) }
  const add = (c, item) => { const it = { id: uid(c[0]), ...item }; mutate((d) => { d[c].unshift(it); return d }); return it }
  const patch = (c, id, p) => mutate((d) => { d[c] = d[c].map((x) => (x.id === id ? { ...x, ...p } : x)); return d })
  const del = (c, id) => mutate((d) => { d[c] = d[c].filter((x) => x.id !== id); return d })
  const alert = (userId, title, body, type = 'info') => mutate((d) => { d.notifications.unshift({ id: uid('n'), userId, title, body, type, time: new Date().toISOString(), read: false }); return d })
  const alertMgrs = (title, body) => mutate((d) => { d.users.filter((u) => u.role === 'manager' || u.role === 'admin').forEach((u) => d.notifications.unshift({ id: uid('n'), userId: u.id, title, body, type: 'request', time: new Date().toISOString(), read: false })); return d })
  const audit = (text) => mutate((d) => { d.audit.unshift({ id: uid('au'), text, by: me ? me.name : 'System', time: new Date().toISOString() }); d.audit = d.audit.slice(0, 80); return d })
  const login = (email, pass) => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === pass)
    if (!u) return 'Email or password is incorrect.'
    if (u.status !== 'Active') return 'This account is inactive. Contact your administrator.'
    mutate((d) => { d.session = u.id; return d }); return null
  }
  const logout = () => mutate((d) => { d.session = null; return d })
  const reset = () => { localStorage.removeItem(KEY); setDb(seed()) }

  return <Ctx.Provider value={{ db, me, user, mutate, notify, toast, add, patch, del, alert, alertMgrs, audit, login, logout, reset }}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)
