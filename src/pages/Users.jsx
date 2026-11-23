import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useStore } from '../context/Store'
import { PageHead, SearchBox, Badge, Who, Modal, Field } from '../components/ui'

const ROLES = ['admin', 'manager', 'hr', 'employee']
const COLORS = ['#0F6B5C', '#2F5D9E', '#8A5A2B', '#6B4C9A', '#B0413E', '#3D6B2F', '#1F6F8B']

export default function Users() {
  const { db, me, add, patch, del, mutate, notify, audit } = useStore()
  const isAdmin = me.role === 'admin'
  const [q, setQ] = useState(''), [role, setRole] = useState('all'), [dept, setDept] = useState('all'), [f, setF] = useState(null), [newDept, setNewDept] = useState('')
  const rows = db.users.filter((u) => (role === 'all' || u.role === role) && (dept === 'all' || u.dept === dept) && [u.name, u.email, u.position].join(' ').toLowerCase().includes(q.toLowerCase()))
  const blank = { name: '', email: '', role: 'employee', dept: db.departments[0], position: '', rate: 300, phone: '', status: 'Active', password: 'demo123' }
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return notify('Enter a name and a valid email', 'err')
    if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== f.id)) return notify('That email is already in use', 'err')
    const data = { ...f, rate: Number(f.rate) || 0 }
    if (f.id) patch('users', f.id, data)
    else add('users', { ...data, color: COLORS[db.users.length % COLORS.length], availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], from: '06:00', to: '22:00', maxHours: 40 } })
    audit(`${f.id ? 'Updated' : 'Added'} user ${f.name}`); notify(f.id ? 'User updated' : 'User added'); setF(null)
  }
  const remove = (u) => { if (u.id === me.id) return notify('You cannot delete your own account', 'err'); if (window.confirm(`Delete ${u.name}? Their shifts become open.`)) { mutate((d) => { d.users = d.users.filter((x) => x.id !== u.id); d.shifts.forEach((s) => { if (s.assignedTo === u.id) { s.assignedTo = null; s.accepted = false } }); return d }); audit(`Deleted user ${u.name}`); notify('User deleted') } }
  const addDept = () => { const n = newDept.trim(); if (!n || db.departments.includes(n)) return notify('Enter a new department name', 'err'); mutate((d) => { d.departments.push(n); return d }); setNewDept(''); notify('Department added') }
  return (
    <>
      <PageHead title="Users and roles" sub="Manage employee, manager and department accounts, roles and permissions."><button className="btn primary" onClick={() => setF(blank)}><Plus size={15} />Add user</button></PageHead>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search name, email or position" />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role"><option value="all">All roles</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"><option value="all">All departments</option>{db.departments.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((u) => <tr key={u.id}><td><Who user={u} sub={u.email} /></td><td><Badge>{u.role}</Badge></td><td>{u.dept}<div className="sub">{u.position}</div></td><td className="num">{u.phone}</td>
            <td><button className="btn sm" onClick={() => { patch('users', u.id, { status: u.status === 'Active' ? 'Inactive' : 'Active' }); notify('Status updated') }}><Badge>{u.status}</Badge></button></td>
            <td><div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}><button className="btn icon" aria-label="Edit user" onClick={() => setF({ ...u })}><Pencil size={14} /></button><button className="btn icon danger" aria-label="Delete user" onClick={() => remove(u)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
      </div>
      <div className="card"><div className="card-h"><h3>Departments</h3></div><div className="card-b"><div className="row" style={{ marginBottom: 14 }}>
        {db.departments.map((d) => <span className="badge teal" key={d}><Building2 size={12} />{d}, {db.users.filter((u) => u.dept === d).length} people</span>)}</div>
        <div className="row"><input className="input" style={{ maxWidth: 260 }} value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="New department name" onKeyDown={(e) => e.key === 'Enter' && addDept()} /><button className="btn" onClick={addDept}>Add department</button></div></div></div>
      {f && <Modal title={f.id ? 'Edit user' : 'Add user'} onClose={() => setF(null)} footer={<><button className="btn" onClick={() => setF(null)}>Cancel</button><button className="btn primary" onClick={save}>{f.id ? 'Save changes' : 'Add user'}</button></>}>
        <div className="f2"><Field label="Full name"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field><Field label="Work email"><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Role"><select className="input" value={f.role} disabled={!isAdmin} onChange={(e) => set('role', e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label="Department"><select className="input" value={f.dept} onChange={(e) => set('dept', e.target.value)}>{db.departments.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Position"><input className="input" value={f.position} onChange={(e) => set('position', e.target.value)} /></Field><Field label="Hourly rate (INR)"><input className="input" type="number" min="0" value={f.rate} onChange={(e) => set('rate', e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field><Field label="Password"><input className="input" value={f.password} onChange={(e) => set('password', e.target.value)} /></Field></div>
        {!isAdmin && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Only administrators can change roles.</p>}
      </Modal>}
    </>
  )
}
