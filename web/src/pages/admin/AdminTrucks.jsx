import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteTruck, fetchTrucks } from '../../api/trucks';
import { formatRupiah } from '../../utils/format';
import Reveal from '../../components/Reveal';

export default function AdminTrucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchTrucks({ per_page: 50 })
      .then((result) => setTrucks(result.data))
      .catch(() => setError('Gagal memuat data truck.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(truck) {
    if (!window.confirm(`Hapus truck "${truck.brand} ${truck.model}"?`)) return;
    try { await deleteTruck(truck.id); load(); } catch { setError('Gagal menghapus truck.'); }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Truck</h1>
            <p className="mt-1 text-sm text-gray-400">Tambah, ubah, dan hapus truck di showroom.</p>
          </div>
          <Link to="/admin/trucks/new" className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold">+ Tambah Truck</Link>
        </div>
      </Reveal>

      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : trucks.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">🚛</p>
          <p className="mt-3 text-sm text-gray-400">Belum ada truck. Klik "Tambah Truck" untuk menambah.</p>
        </div></Reveal>
      ) : (
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50 text-left text-gray-400">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Truck</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Tahun</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trucks.map((truck) => (
                    <tr key={truck.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-16 overflow-hidden rounded-xl bg-gray-100">
                            {truck.images?.[0]?.image_url ? (
                              <img src={truck.images[0].image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-lg">🚛</div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal">{truck.brand} {truck.model}</p>
                            <p className="text-xs text-gray-400">{truck.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{truck.year || '-'}</td>
                      <td className="px-6 py-4 font-bold text-primary">{formatRupiah(truck.price)}</td>
                      <td className="px-6 py-4 text-gray-500">{truck.category?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${truck.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {truck.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/trucks/${truck.id}/edit`} className="font-semibold text-secondary hover:underline">Edit</Link>
                        <button onClick={() => handleDelete(truck)} className="ml-3 font-semibold text-red-500 hover:text-red-600">Hapus</button>
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
