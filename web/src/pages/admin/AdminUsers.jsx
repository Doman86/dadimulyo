import { useCallback, useEffect, useState } from 'react';
import { fetchUsers } from '../../api/leads';
import Reveal from '../../components/Reveal';

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-red-50 text-red-600 border border-red-100' },
  { value: 'sales', label: 'Sales', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
  { value: 'truck_seller', label: 'Truck Seller', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
  { value: 'orange_seller', label: 'Orange Seller', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  { value: 'customer', label: 'Customer', color: 'bg-gray-50 text-gray-600 border border-gray-100' },
  { value: 'driver', label: 'Driver', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
];

const ROLE_COLORS = Object.fromEntries(ROLES.map((r) => [r.value, r.color]));

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

  useEffect(() => { load(); }, [load]);

  function getRoleBadge(roleName) {
    const role = ROLES.find((r) => r.value === roleName);
    if (!role) return <span className="text-xs text-gray-500">{roleName}</span>;
    return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[roleName] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{role.label}</span>;
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Pengguna</h1>
            <p className="mt-1 text-sm text-gray-400">Daftar semua pengguna sistem.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRoleFilter('')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${roleFilter === '' ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>Semua</button>
            {ROLES.map((r) => (
              <button key={r.value} onClick={() => setRoleFilter(r.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${roleFilter === r.value ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>{r.label}</button>
            ))}
          </div>
        </div>
      </Reveal>

      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : users.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">👤</p>
          <p className="mt-3 text-sm text-gray-400">Tidak ada pengguna ditemukan.</p>
        </div></Reveal>
      ) : (
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50 text-left text-gray-400">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Pengguna</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Telepon</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <p className="font-semibold text-charcoal">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 text-gray-500">{u.phone || '-'}</td>
                      <td className="px-6 py-4">{getRoleBadge(u.role?.name)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${u.status === 'active' || !u.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
