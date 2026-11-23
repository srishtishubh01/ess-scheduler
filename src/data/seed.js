import { addDays, today, weekStart, toMin, fromMin } from '../utils'

const COLORS = ['#0F6B5C', '#2F5D9E', '#8A5A2B', '#6B4C9A', '#B0413E', '#3D6B2F', '#1F6F8B', '#7A5C00']
const LOC = { 'Front Desk': 'Main Lobby', Kitchen: 'Central Kitchen', Warehouse: 'Dock B', Support: 'Help Center' }
const TITLES = {
  'Front Desk': ['Front desk opening', 'Front desk closing'],
  Kitchen: ['Kitchen prep', 'Dinner service'],
  Warehouse: ['Inbound receiving', 'Dispatch run'],
  Support: ['Support day desk', 'Support late desk'],
}

export function seed() {
  const departments = ['Front Desk', 'Kitchen', 'Warehouse', 'Support']
  let i = 0
  const mk = (name, email, role, dept, position, rate, av = {}) => ({
    id: 'u' + ++i, name, email: email + '@northwind.in', password: 'demo123', role, dept, position, rate,
    status: 'Active', phone: '+91 98' + String(71234560 + i * 7919).slice(0, 8), color: COLORS[i % COLORS.length],
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], from: '06:00', to: '22:00', maxHours: 40, ...av },
  })
  const users = [
    mk('Aarav Mehta', 'admin', 'admin', 'Support', 'System administrator', 0),
    mk('Priya Nair', 'manager', 'manager', 'Front Desk', 'Operations manager', 0),
    mk('Neha Kapoor', 'hr', 'hr', 'Support', 'HR partner', 0),
    mk('Rohan Verma', 'employee', 'employee', 'Front Desk', 'Receptionist', 320),
    mk('Ananya Iyer', 'ananya', 'employee', 'Front Desk', 'Guest services', 340),
    mk('Kabir Singh', 'kabir', 'employee', 'Kitchen', 'Line cook', 380),
    mk('Meera Joshi', 'meera', 'employee', 'Kitchen', 'Prep cook', 350, { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }),
    mk('Imran Qureshi', 'imran', 'employee', 'Warehouse', 'Forklift operator', 420),
    mk('Divya Rao', 'divya', 'employee', 'Warehouse', 'Inventory associate', 360, { maxHours: 32 }),
    mk('Sahil Bansal', 'sahil', 'employee', 'Support', 'Support agent', 400),
    mk('Tara Menon', 'tara', 'employee', 'Support', 'Support agent', 400, { from: '10:00', to: '22:00' }),
  ]
  const emps = users.filter((u) => u.role === 'employee')
  const t = today(), ws = weekStart(t)
  const shifts = [], attendance = []
  let n = 0
  for (const off of [-7, 0, 7]) for (let d = 0; d < 6; d++) {
    const date = addDays(ws, off + d)
    departments.forEach((dep, di) => {
      n++
      const morning = (d + di) % 2 === 0
      const [start, end] = morning ? ['08:00', '16:00'] : ['14:00', '22:00']
      const pool = emps.filter((e) => e.dept === dep)
      const emp = pool[d % pool.length]
      const open = (off === 7 && d >= 4) || (off === 0 && d === 5 && di < 2)
      const s = {
        id: 's' + n, title: TITLES[dep][morning ? 0 : 1], date, start, end, position: emp.position, dept: dep, location: LOC[dep],
        assignedTo: open ? null : emp.id, status: off === 7 && d >= 4 ? 'draft' : 'published', accepted: !open && (off <= 0 || d < 2),
      }
      shifts.push(s)
      if (!open && date < t && n % 13 !== 0) {
        attendance.push({
          id: 'a' + n, userId: emp.id, shiftId: s.id, date,
          in: fromMin(toMin(start) + ((n * 7) % 28) - 4), out: fromMin(toMin(end) + ((n * 5) % 16) - 3),
        })
      }
    })
  }
  const mine = emps[0].id
  const fut = (id) => shifts.find((s) => s.date > t && s.assignedTo === id && s.status === 'published')
  const hAgo = (h) => new Date(Date.now() - 36e5 * h).toISOString()
  const swaps = [
    { id: 'sw1', shiftId: fut(mine).id, fromId: mine, toId: emps[1].id, reason: 'Family function that evening', status: 'pending', created: hAgo(5) },
    { id: 'sw2', shiftId: fut(emps[2].id).id, fromId: emps[2].id, toId: emps[3].id, reason: 'Medical appointment', status: 'approved', created: hAgo(72) },
  ]
  const timeoff = [
    { id: 'to1', userId: emps[4].id, from: addDays(t, 9), to: addDays(t, 11), type: 'Paid time off', reason: 'Travel', status: 'approved', created: hAgo(96) },
    { id: 'to2', userId: emps[5].id, from: addDays(t, 4), to: addDays(t, 4), type: 'Personal', reason: 'Bank work', status: 'pending', created: hAgo(9) },
    { id: 'to3', userId: emps[7].id, from: addDays(t, -6), to: addDays(t, -5), type: 'Sick leave', reason: 'Fever', status: 'rejected', created: hAgo(190) },
  ]
  const notifications = [
    { id: 'n1', userId: 'all', title: 'Festive roster published', body: 'Schedules through next week are live. Review your shifts and accept them.', type: 'info', time: hAgo(20), read: false },
    { id: 'n2', userId: mine, title: 'Shift reminder', body: 'You may have a front desk shift today. Clock in when you arrive.', type: 'shift', time: hAgo(2), read: false },
    { id: 'n3', userId: 'u2', title: 'Swap request awaiting approval', body: 'Rohan Verma asked to swap a shift with Ananya Iyer.', type: 'request', time: hAgo(5), read: false },
    { id: 'n4', userId: 'u2', title: 'Time-off request awaiting approval', body: 'Kabir Singh requested personal leave.', type: 'request', time: hAgo(9), read: false },
    { id: 'n5', userId: mine, title: 'Swap request submitted', body: 'Your swap request is waiting for manager approval.', type: 'info', time: hAgo(5), read: true },
  ]
  const audit = [
    { id: 'au1', text: 'Published schedule for next week', by: 'Priya Nair', time: hAgo(21) },
    { id: 'au2', text: 'Approved swap request', by: 'Priya Nair', time: hAgo(70) },
    { id: 'au3', text: 'Updated overtime threshold to 40 hours', by: 'Aarav Mehta', time: hAgo(120) },
  ]
  const integrations = [
    { id: 'pay', name: 'Payroll export', desc: 'Send approved hours to your payroll provider every cycle.', connected: true, last: hAgo(30) },
    { id: 'mail', name: 'Email alerts', desc: 'Deliver shift reminders and approval outcomes by email.', connected: true, last: hAgo(3) },
    { id: 'sms', name: 'SMS notifications', desc: 'Text employees about last-minute schedule changes.', connected: false, last: null },
    { id: 'chat', name: 'Team chat', desc: 'Post open shifts to your team chat channel.', connected: false, last: null },
  ]
  return {
    users, departments, shifts, swaps, timeoff, attendance, notifications, audit, integrations,
    settings: { org: 'Northwind Hospitality', timezone: 'Asia/Kolkata', grace: 10, overtime: 40, twoFA: false, timeout: 30 },
    session: null,
  }
}
