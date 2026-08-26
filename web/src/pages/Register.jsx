import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const result = await register(form);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
            <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Daftar Akun</h1>
            <p className="mt-1 text-sm text-gray-400">Buat akun untuk mulai berbelanja</p>
          </div>

          {error && (
            <div className="mt-4 alert-lux-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-lux">Nama Lengkap</label>
              <input type="text" required value={form.name} onChange={set('name')} placeholder="Nama lengkap Anda" className="input-lux" />
            </div>
            <div>
              <label className="label-lux">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="email@contoh.com" className="input-lux" />
            </div>
            <div>
              <label className="label-lux">No. HP / WhatsApp *</label>
              <input type="tel" required value={form.phone} onChange={set('phone')} placeholder="0812-xxxx-xxxx" className="input-lux" />
            </div>
            <div>
              <label className="label-lux">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Min. 8 karakter" className="input-lux" />
            </div>
            <div>
              <label className="label-lux">Konfirmasi Password</label>
              <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Ulangi password" className="input-lux" />
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
              ) : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-bold text-secondary hover:underline">Masuk di sini</Link>
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
