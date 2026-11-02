import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import './Dashboard.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
