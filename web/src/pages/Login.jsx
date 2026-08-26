import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(location.state?.from || '/dashboard');
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4 py-16">
      <Reveal variant="zoom" className="w-full max-w-md">
        <div className="card-lux p-8 !rounded-2xl">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep font-display text-lg font-bold text-forest shadow-lg shadow-gold/30">
                DM
              </span>
            </Link>
            <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Masuk</h1>
            <p className="mt-1 text-sm text-gray-400">Selamat datang kembali di Dadi Mulyo</p>
          </div>

          {error && (
            <div className="mt-4 alert-lux-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-lux">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@contoh.com"
                className="input-lux"
              />
            </div>
            <div>
              <label className="label-lux">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Masukkan password"
                className="input-lux"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link to="/register" className="font-bold text-secondary hover:underline">Daftar di sini</Link>
            </p>
          </div>

          <div className="divider-gold my-5" />

          <Link to="/" className="block text-center text-xs text-gray-400 hover:text-primary transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
