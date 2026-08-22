import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  const role = user?.role?.name;
  const canTrucks = role === 'admin' || role === 'truck_seller';
  const canLeads = role === 'admin' || role === 'sales';
  const canOranges = role === 'admin' || role === 'orange_seller';
  const isAdmin = role === 'admin';

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="w-52 shrink-0">
        <h2 className="px-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          Panel Kelola
        </h2>
        <nav className="mt-3 flex flex-col gap-1 text-sm">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `rounded px-3 py-2 font-medium ${
                isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            📊 Dashboard
          </NavLink>
          {canTrucks && (
            <NavLink
              to="/admin/trucks"
              end
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              🚛 Kelola Truck
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/rentals"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              📅 Kelola Rental
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              🧾 Pesanan
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/deliveries"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              🚛 Pengiriman
            </NavLink>
          )}
          {canOranges && (
            <NavLink
              to="/admin/oranges"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              🍊 Produk Jeruk
            </NavLink>
          )}
          {canLeads && (
            <NavLink
              to="/admin/sales"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              📌 Dashboard Sales
            </NavLink>
          )}
          {canLeads && (
            <NavLink
              to="/admin/leads"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              💬 Leads
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              👤 Pengguna
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/reports"
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              📈 Laporan
            </NavLink>
          )}
          <div className="my-2 border-t border-gray-200" />
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded px-3 py-2 font-medium ${
                isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            🏠 Kembali ke Dashboard
          </NavLink>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}
