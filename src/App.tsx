import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProfileProvider } from './lib/profile'
import { PublicOnly, RequireAuth, RequireProfile } from './routes/guards'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CreateProfile from './pages/CreateProfile'
import Welcome from './pages/Welcome'

/** Signed-in area: session required, profile loaded once for all pages inside. */
function SignedIn() {
  return (
    <RequireAuth>
      <ProfileProvider>
        <Outlet />
      </ProfileProvider>
    </RequireAuth>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route element={<SignedIn />}>
        {/* New users must finish Create profile before anything else. */}
        <Route path="/create-profile" element={<RequireProfile mode="incomplete"><CreateProfile /></RequireProfile>} />
        <Route path="/welcome" element={<RequireProfile><Welcome /></RequireProfile>} />
      </Route>
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
