import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-primary">Daftar Akun</h1>
      {error && (
        <p className="mt-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">No. HP / WhatsApp *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={set('phone')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
          <input
            type="password"
            required
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-medium text-secondary">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
