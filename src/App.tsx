import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { PublicOnly, RequireAuth } from './routes/guards'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Signup from './pages/Signup'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/welcome" element={<RequireAuth><Welcome /></RequireAuth>} />
      {/* Everything else requires sign-in; signed-in users land on /welcome. */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
