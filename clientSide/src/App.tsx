import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/app-layout'
import { AuthProvider } from '@/components/auth-provider'
import { RequireAuth } from '@/components/require-auth'
import { LoginPage } from '@/pages/login-page'
import { ReadingsPage } from '@/pages/readings-page'
import { ReportsPage } from '@/pages/reports-page'
import { SignupPage } from '@/pages/signup-page'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Everything inside here needs a logged-in user and shows the nav band */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<ReadingsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
