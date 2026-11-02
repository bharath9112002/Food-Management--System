import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { MenuProvider } from './context/MenuContext'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import FoodDetails from './pages/FoodDetails'
import Login from './pages/Login'
import Menu from './pages/Menu'
import Register from './pages/Register'
import RestaurantDetails from './pages/RestaurantDetails'
import Restaurants from './pages/Restaurants'
import './App.css'
import './Dashboard.css'
import './Restaurants.css'
import './Menu.css'

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
            <Route
              element={
                <MenuProvider>
                  <DashboardLayout />
                </MenuProvider>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetails />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/menu/:id" element={<FoodDetails />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
