import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-primary text-white shadow-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          Dadi <span className="text-secondary">Mulyo</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-secondary">
            Beranda
          </Link>
          <Link to="/trucks" className="hover:text-secondary">
            Truck
          </Link>
          <Link to="/rental" className="hover:text-secondary">
            Sewa
          </Link>
          <Link to="/oranges" className="hover:text-secondary">
            Jeruk
          </Link>
          <Link to="/about" className="hover:text-secondary hidden md:inline">
            Tentang
          </Link>
          <Link to="/contact" className="hover:text-secondary hidden md:inline">
            Kontak
          </Link>
          <Link to="/cart" className="relative hover:text-secondary">
            🛒
            {count > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-secondary">
                Dashboard
              </Link>
              {(user.role?.name === 'admin' || user.role?.name === 'truck_seller' || user.role?.name === 'sales' || user.role?.name === 'orange_seller') && (
                <Link to="/admin/dashboard" className="hover:text-secondary">
                  Panel Admin
                </Link>
              )}
              <span className="hidden sm:inline text-gray-300">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded bg-secondary px-3 py-1.5 font-medium hover:opacity-90"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-secondary">
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded bg-secondary px-3 py-1.5 font-medium hover:opacity-90"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
