import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [message, setMessage] = useState(null);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-600">Silakan login untuk melihat profil.</p>
        <Link to="/login" className="mt-3 inline-block font-medium text-secondary hover:underline">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Profil Saya</h1>
      <p className="mt-1 text-gray-600">Informasi akun Anda di Dadi Mulyo.</p>

      {message && (
        <p
          className={`mt-4 rounded px-3 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-8 rounded-lg border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">
              {user.role?.name
                ? user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1).replace('_', ' ')
                : 'Customer'}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex flex-col gap-1 border-b pb-4">
            <dt className="font-medium text-gray-500">Email</dt>
            <dd className="text-gray-900">{user.email}</dd>
          </div>
          {user.phone && (
            <div className="flex flex-col gap-1 border-b pb-4">
              <dt className="font-medium text-gray-500">Telepon</dt>
              <dd className="text-gray-900">{user.phone}</dd>
            </div>
          )}
          <div className="flex flex-col gap-1 border-b pb-4">
            <dt className="font-medium text-gray-500">Status</dt>
            <dd>
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                {user.status || 'active'}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-medium text-gray-500">Terdaftar sejak</dt>
            <dd className="text-gray-900">
              {new Date(user.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/orders"
          className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
        >
          🧾 Riwayat Pesanan
        </Link>
        <Link
          to="/rental"
          className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
        >
          🚚 Sewa Truck
        </Link>
      </div>
    </div>
  );
}
