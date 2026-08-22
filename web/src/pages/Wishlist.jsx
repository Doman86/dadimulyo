import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlists, toggleWishlist } from '../api/trucks';
import { formatRupiah } from '../utils/format';

export default function Wishlist() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlists()
      .then((result) => setTrucks(Array.isArray(result) ? result : result.data || []))
      .catch(() => setError('Gagal memuat wishlist.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(truckId) {
    try {
      await toggleWishlist(truckId);
      setTrucks((prev) => prev.filter((t) => t.id !== truckId));
    } catch {
      setError('Gagal menghapus dari wishlist.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Wishlist Truck</h1>
      <p className="mt-1 text-gray-600">Truck yang Anda simpan.</p>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-10 text-center text-gray-500">Memuat data...</p>
      ) : trucks.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-5xl">♡</p>
          <p className="mt-3 text-gray-600">Belum ada truck tersimpan.</p>
          <Link to="/trucks" className="mt-3 inline-block font-medium text-secondary hover:underline">
            Jelajahi katalog truck
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <div
              key={truck.id}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
            >
              <Link to={`/trucks/${truck.id}`}>
                <div className="aspect-video w-full bg-gray-200">
                  {truck.images?.[0]?.image_url ? (
                    <img
                      src={truck.images[0].image_url}
                      alt={`${truck.brand} ${truck.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🚛</div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      {truck.year} · {truck.category?.name || 'Truck'}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary">
                      {truck.brand} {truck.model}
                    </h2>
                    <div className="mt-2 font-bold text-primary">{formatRupiah(truck.price)}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(truck.id)}
                    className="shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    title="Hapus dari wishlist"
                  >
                    ♥ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
