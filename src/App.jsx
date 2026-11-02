import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { MenuProvider } from './context/MenuContext'
import { OrdersProvider } from './context/OrdersContext'
import ForgotPassword from './pages/ForgotPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import FoodDetails from './pages/FoodDetails'
import Login from './pages/Login'
import Menu from './pages/Menu'
import OrderConfirmation from './pages/OrderConfirmation'
import Orders from './pages/Orders'
import OrderTracking from './pages/OrderTracking'
import Register from './pages/Register'
import RestaurantDetails from './pages/RestaurantDetails'
import Restaurants from './pages/Restaurants'
import './App.css'
import './Dashboard.css'
import './Restaurants.css'
import './Menu.css'
import './Cart.css'
import './Checkout.css'
import './Tracking.css'

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
                  <CartProvider>
                    <OrdersProvider>
                      <DashboardLayout />
                    </OrdersProvider>
                  </CartProvider>
                </MenuProvider>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetails />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/menu/:id" element={<FoodDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
              <Route path="/orders/:id/confirmation" element={<OrderConfirmation />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
