import { useCallback, useEffect, useState } from 'react';
import { fetchUsers } from '../../api/leads';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'truck_seller', label: 'Truck Seller' },
  { value: 'orange_seller', label: 'Orange Seller' },
  { value: 'customer', label: 'Customer' },
  { value: 'driver', label: 'Driver' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers(roleFilter ? { role: roleFilter, per_page: 50 } : { per_page: 50 })
      .then((result) => setUsers(result || []))
      .catch(() => setError('Gagal memuat data pengguna.'))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function getRoleBadge(roleName) {
    const role = ROLES.find((r) => r.value === roleName);
    if (!role) return <span className="text-xs text-gray-500">{roleName}</span>;
    const colors = {
      admin: 'bg-red-100 text-red-700',
      sales: 'bg-blue-100 text-blue-700',
      truck_seller: 'bg-purple-100 text-purple-700',
      orange_seller: 'bg-green-100 text-green-700',
      customer: 'bg-gray-100 text-gray-700',
      driver: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${colors[roleName] || 'bg-gray-100 text-gray-700'}`}>
        {role.label}
      </span>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Pengguna</h1>
          <p className="text-sm text-gray-600">Daftar semua pengguna sistem.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter('')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              roleFilter === '' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                roleFilter === r.value ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : users.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Tidak ada pengguna ditemukan.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telepon</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="font-semibold text-gray-900">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                  <td className="px-4 py-3">{getRoleBadge(u.role?.name)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        u.status === 'active' || !u.status
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
