import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteTruck, fetchTrucks } from '../../api/trucks';
import { formatRupiah } from '../../utils/format';

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

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(truck) {
    if (!window.confirm(`Hapus truck "${truck.brand} ${truck.model}"?`)) return;
    try {
      await deleteTruck(truck.id);
      load();
    } catch {
      setError('Gagal menghapus truck.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Truck</h1>
          <p className="text-sm text-gray-600">Tambah, ubah, dan hapus truck di showroom.</p>
        </div>
        <Link
          to="/admin/trucks/new"
          className="rounded bg-primary px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          + Tambah Truck
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : trucks.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada truck. Klik "Tambah Truck".</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Truck</th>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden rounded bg-gray-100">
                        {truck.images?.[0]?.image_url ? (
                          <img
                            src={truck.images[0].image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-lg">🚛</div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {truck.brand} {truck.model}
                        </div>
                        <div className="text-xs text-gray-500">{truck.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{truck.year || '-'}</td>
                  <td className="px-4 py-3">{formatRupiah(truck.price)}</td>
                  <td className="px-4 py-3">{truck.category?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        truck.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {truck.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/trucks/${truck.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(truck)}
                      className="ml-3 font-medium text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
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
