import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { MenuProvider } from './context/MenuContext'
import { OrdersProvider } from './context/OrdersContext'
import { ROLES } from './utils/storage'
import ForgotPassword from './pages/ForgotPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CustomerDashboard from './pages/CustomerDashboard'
import Dashboard from './pages/Dashboard'
import FoodDetails from './pages/FoodDetails'
import Login from './pages/Login'
import Menu from './pages/Menu'
import OrderConfirmation from './pages/OrderConfirmation'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import OrderTracking from './pages/OrderTracking'
import PaymentFailed from './pages/PaymentFailed'
import AdminCarts from './pages/admin/AdminCarts'
import AdminOrderDetails from './pages/admin/AdminOrderDetails'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPlaceOrder from './pages/admin/AdminPlaceOrder'
import AdminTracking from './pages/admin/AdminTracking'
import PaymentSuccess from './pages/PaymentSuccess'
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
import './Profile.css'
import './Customer.css'
import './Payment.css'
import './Admin.css'
import './Invoice.css'

// Same URL, different home: admins get the business dashboard, customers their own.
function Home() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Dashboard /> : <CustomerDashboard />
}

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
                  <OrdersProvider>
                    <CartProvider>
                      <DashboardLayout />
                    </CartProvider>
                  </OrdersProvider>
                </MenuProvider>
              }
            >
              {/* Shared: content adapts to the role */}
              <Route path="/" element={<Home />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetails />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/menu/:id" element={<FoodDetails />} />
              <Route path="/profile" element={<Profile />} />

              {/* Customer only: ordering */}
              <Route element={<RoleRoute allow={[ROLES.CUSTOMER]} />}>
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderTracking />} />
                <Route path="/orders/:id/confirmation" element={<OrderConfirmation />} />
                <Route path="/payment/success/:id" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />
              </Route>

              {/* Admin only: manage every customer's carts and orders */}
              <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
                <Route path="/admin/carts" element={<AdminCarts />} />
                <Route path="/admin/place-order" element={<AdminPlaceOrder />} />
                <Route path="/admin/tracking" element={<AdminTracking />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
