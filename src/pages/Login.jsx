import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CalendarRange, Lock, Mail } from 'lucide-react'
import { useStore } from '../context/Store'

const DEMOS = [['admin@northwind.in', 'Administrator', 'Users, security'], ['manager@northwind.in', 'Manager', 'Build and publish'], ['hr@northwind.in', 'HR', 'Records, reports'], ['employee@northwind.in', 'Employee', 'Shifts, swaps']]

export default function Login() {
  const { me, login } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  if (me) return <Navigate to="/" replace />
  const submit = (e) => { e.preventDefault(); const r = login(email, pass); if (r) setErr(r); else nav('/') }
  return (
    <div className="login">
      <section className="login-art">
        <div className="brand"><i><CalendarRange size={17} color="#fff" /></i><div>Rostra<small>Employee Shift Scheduler</small></div></div>
        <div>
          <h1>Build the week once. Keep it conflict-free.</h1>
          <p>Create shifts, check eligibility automatically, handle swaps and time off, and reconcile attendance, all in one place.</p>
          <div className="mini">{Array.from({ length: 24 }).map((_, i) => <div key={i} className={['', 'a', '', 'b', '', 'c', 'd', '', 'a', '', '', 'b'][i % 12]} />)}</div>
        </div>
        <small style={{ color: '#6F8695' }}>Software Engineering, CS3CO40, Experiment 2</small>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <h2>Sign in</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 22 }}>Use your work email and password.</p>
          <div className="field"><label htmlFor="em">Email</label><div className="search"><Mail size={15} /><input id="em" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@northwind.in" /></div></div>
          <div className="field"><label htmlFor="pw">Password</label><div className="search"><Lock size={15} /><input id="pw" className="input" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Enter your password" /></div></div>
          {err && <div className="alertbox" style={{ background: 'var(--red-l)', borderColor: '#EBC3C1', color: 'var(--red)' }}>{err}</div>}
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: 10 }}>Sign in</button>
          <p style={{ margin: '24px 0 4px', fontWeight: 500 }}>Try a demo account</p>
          <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Password for all demo accounts: demo123</p>
          <div className="demo">{DEMOS.map(([e, r, s]) => <button type="button" key={e} className="btn" onClick={() => { setEmail(e); setPass('demo123'); setErr('') }}><span><b>{r}</b><small>{s}</small></span></button>)}</div>
        </form>
      </section>
    </div>
  )
}
