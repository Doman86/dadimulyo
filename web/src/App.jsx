import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Trucks from './pages/Trucks';
import TruckDetail from './pages/TruckDetail';
import Rental from './pages/Rental';
import Oranges from './pages/Oranges';
import OrangeDetail from './pages/OrangeDetail';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTrucks from './pages/admin/AdminTrucks';
import TruckForm from './pages/admin/TruckForm';
import AdminLeads from './pages/admin/AdminLeads';
import AdminRentals from './pages/admin/AdminRentals';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminOranges from './pages/admin/AdminOranges';
import OrangeForm from './pages/admin/OrangeForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import SalesDashboard from './pages/admin/SalesDashboard';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import CompareTrucks from './pages/CompareTrucks';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  const role = user?.role?.name;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role?.name !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trucks" element={<Trucks />} />
          <Route path="/trucks/:id" element={<TruckDetail />} />
          <Route path="/compare" element={<CompareTrucks />} />
          <Route path="/rental" element={<Rental />} />
          <Route path="/oranges" element={<Oranges />} />
          <Route path="/oranges/:id" element={<OrangeDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="sales" element={<SalesDashboard />} />
            <Route path="trucks" element={<AdminTrucks />} />
            <Route path="trucks/new" element={<TruckForm />} />
            <Route path="trucks/:id/edit" element={<TruckForm />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="oranges" element={<AdminOranges />} />
            <Route path="oranges/new" element={<OrangeForm />} />
            <Route path="oranges/:id/edit" element={<OrangeForm />} />
            <Route path="users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route
              path="rentals"
              element={
                <RequireAdmin>
                  <AdminRentals />
                </RequireAdmin>
              }
            />
            <Route
              path="orders"
              element={
                <RequireAdmin>
                  <AdminOrders />
                </RequireAdmin>
              }
            />
            <Route
              path="deliveries"
              element={
                <RequireAdmin>
                  <AdminDeliveries />
                </RequireAdmin>
              }
            />
            <Route
              path="reports"
              element={
                <RequireAdmin>
                  <AdminReports />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
