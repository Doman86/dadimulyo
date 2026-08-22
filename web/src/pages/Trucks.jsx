import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchTrucks } from '../api/trucks';
import { formatRupiah } from '../utils/format';

export default function Trucks() {
  const [categories, setCategories] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    condition: '',
    sort: 'newest',
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.condition) params.condition = filters.condition;
    if (filters.sort) params.sort = filters.sort;

    fetchTrucks(params)
      .then((result) => {
        if (cancelled) return;
        setTrucks(result.data);
        setMeta(result.meta || {});
      })
      .catch(() => {
        if (!cancelled) setTrucks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  function toggleCompare(truck) {
    const current = JSON.parse(localStorage.getItem('compare_trucks') || '[]');
    const exists = current.some((item) => item.id === truck.id);
    if (exists) {
      localStorage.setItem('compare_trucks', JSON.stringify(current.filter((item) => item.id !== truck.id)));
    } else if (current.length < 4) {
      localStorage.setItem('compare_trucks', JSON.stringify([...current, truck]));
    }
    window.dispatchEvent(new Event('storage'));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Katalog Truck</h1>
      <p className="mt-1 text-gray-600">Temukan truck yang sesuai kebutuhan Anda.</p>
      <Link to="/compare" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">Buka perbandingan truck</Link>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Cari merek / model..."
          value={filters.search}
          onChange={set('search')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        />
        <select
          value={filters.category_id}
          onChange={set('category_id')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.condition}
          onChange={set('condition')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        >
          <option value="">Semua Kondisi</option>
          <option value="baru">Baru</option>
          <option value="bekas">Bekas</option>
        </select>
        <select
          value={filters.sort}
          onChange={set('sort')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="price_asc">Harga Terendah</option>
          <option value="price_desc">Harga Tertinggi</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="mt-10 text-center text-gray-500">Memuat data...</p>
      ) : trucks.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">Tidak ada truck yang cocok.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <Link
              key={truck.id}
              to={`/trucks/${truck.id}`}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video w-full bg-gray-200">
                {truck.images?.[0]?.image_url ? (
                  <img
                    src={truck.images[0].image_url}
                    alt={`${truck.brand} ${truck.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    🚛
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500">
                  {truck.year} · {truck.category?.name || 'Truck'}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary">
                  {truck.brand} {truck.model}
                </h2>
                <div className="mt-2 font-bold text-primary">{formatRupiah(truck.price)}</div>
                <div className="mt-1 flex gap-2 text-xs text-gray-500">
                  <span>{truck.transmission}</span>
                  <span>·</span>
                  <span>{truck.fuel_type}</span>
                  <span>·</span>
                  <span>{truck.location}</span>
                </div>
                <button type="button" onClick={(event) => { event.preventDefault(); toggleCompare(truck); }} className="mt-3 rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white">
                  Bandingkan
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Halaman {meta.current_page} dari {meta.last_page}
        </div>
      )}
    </div>
  );
}
