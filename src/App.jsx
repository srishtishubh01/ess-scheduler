import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './context/Store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Shifts from './pages/Shifts'
import Schedule from './pages/Schedule'
import Requests from './pages/Requests'
import Availability from './pages/Availability'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function Guard() { const { me } = useStore(); return me ? <Layout /> : <Navigate to="/login" replace /> }
function Role({ allow, children }) { const { me } = useStore(); return allow.includes(me.role) ? children : <Navigate to="/" replace /> }

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Guard />}>
            <Route index element={<Dashboard />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="requests" element={<Requests />} />
            <Route path="availability" element={<Availability />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="reports" element={<Role allow={['admin', 'manager', 'hr']}><Reports /></Role>} />
            <Route path="users" element={<Role allow={['admin', 'hr']}><Users /></Role>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
