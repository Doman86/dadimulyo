import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const role = user?.role?.name;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const canTrucks = role === 'admin' || role === 'truck_seller';
  const canLeads = role === 'admin' || role === 'sales';
  const canOranges = role === 'admin' || role === 'orange_seller';
  const isAdmin = role === 'admin';

  const roleLabels = {
    admin: 'Administrator',
    sales: 'Sales',
    truck_seller: 'Truck Seller',
    orange_seller: 'Orange Seller',
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊', show: true },
    { to: '/admin/trucks', label: 'Kelola Truck', icon: '🚛', show: canTrucks },
    { to: '/admin/rentals', label: 'Kelola Rental', icon: '📅', show: isAdmin },
    { to: '/admin/orders', label: 'Pesanan', icon: '🧾', show: isAdmin },
    { to: '/admin/deliveries', label: 'Pengiriman', icon: '📦', show: isAdmin },
    { to: '/admin/oranges', label: 'Produk Jeruk', icon: '🍊', show: canOranges },
    { to: '/admin/sales', label: 'Dashboard Sales', icon: '📌', show: canLeads },
    { to: '/admin/leads', label: 'Leads', icon: '💬', show: canLeads },
    { to: '/admin/users', label: 'Pengguna', icon: '👤', show: isAdmin },
    { to: '/admin/reports', label: 'Laporan', icon: '📈', show: isAdmin },
  ];

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-forest via-pine to-forest transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.07]">
          <NavLink to="/admin/dashboard" className="group flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep font-display text-lg font-bold text-forest shadow-lg shadow-gold/30 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
              DM
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
            </span>
            <div>
              <span className="font-display text-lg tracking-tight text-white block leading-tight">
                Dadi <span className="text-gold-gradient">Mulyo</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light/60">
                Admin Panel
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.filter(item => item.show).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold/15 to-gold/5 text-gold-light shadow-lg shadow-gold/5 border border-gold/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                }`
              }
            >
              <span className="text-lg transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info & actions */}
        <div className="border-t border-white/[0.07] px-4 py-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 text-sm font-bold text-gold-light">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gold-light/50">{roleLabels[role] || role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NavLink
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white/80 hover:border-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              User
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400/80 transition-all hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/5 text-forest transition-colors hover:bg-forest/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-display text-lg font-bold text-forest">Admin Panel</span>
        </div>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
