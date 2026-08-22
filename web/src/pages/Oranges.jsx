import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrangeCategories, fetchOranges } from '../api/oranges';
import { formatNumber, formatRupiah } from '../utils/format';

export default function Oranges() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    grade: '',
    in_stock: false,
    sort: 'newest',
  });

  useEffect(() => {
    fetchOrangeCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.grade) params.grade = filters.grade;
    if (filters.in_stock) params.in_stock = 1;
    if (filters.sort) params.sort = filters.sort;

    fetchOranges(params)
      .then((result) => {
        if (cancelled) return;
        setProducts(result.data);
        setMeta(result.meta || {});
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Marketplace Jeruk</h1>
      <p className="mt-1 text-gray-600">
        Jeruk segar langsung dari kebun Wagir &amp; sekitarnya, Malang.
      </p>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Cari produk / lokasi kebun..."
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
          value={filters.grade}
          onChange={set('grade')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        >
          <option value="">Semua Grade</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>
        <select
          value={filters.sort}
          onChange={set('sort')}
          className="rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
        >
          <option value="newest">Terbaru</option>
          <option value="price_asc">Harga Terendah</option>
          <option value="price_desc">Harga Tertinggi</option>
        </select>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={filters.in_stock}
          onChange={set('in_stock')}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        Hanya yang tersedia (stok &gt; 0)
      </label>

      {loading ? (
        <p className="mt-10 text-center text-gray-500">Memuat data...</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">Tidak ada produk yang cocok.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/oranges/${product.id}`}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video w-full bg-gray-200">
                {product.images?.[0]?.image_url ? (
                  <img
                    src={product.images[0].image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">🍊</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{product.category?.name}</span>
                  {product.grade && (
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-white">
                      Grade {product.grade}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold text-primary">
                    {formatRupiah(product.price_per_kg)}
                  </span>
                  <span className="text-xs text-gray-500">/ kg</span>
                </div>
                {product.wholesale_price && (
                  <div className="text-xs text-gray-500">
                    Grosir: <span className="font-semibold">{formatRupiah(product.wholesale_price)}</span>/kg
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Stok {formatNumber(product.stock_kg)} kg · Min. order {formatNumber(product.minimum_order_kg)} kg
                </div>
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
