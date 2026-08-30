import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrangeCategories, fetchOranges } from '../api/oranges';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import siteConfig from '../config/site';

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

    return () => { cancelled = true; };
  }, [filters]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 -right-20 opacity-30" />
        <div className="orb orb-3 bottom-[-50px] left-20 opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">Fresh from {siteConfig.address.city}</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">Marketplace Jeruk</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">
              Jeruk segar langsung dari kebun {siteConfig.address.city} &amp; sekitarnya.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Filters */}
        <Reveal>
          <div className="glass-light rounded-2xl p-5 shadow-sm border border-white/40">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input
                  type="text"
                  placeholder="Cari produk / lokasi kebun..."
                  value={filters.search}
                  onChange={set('search')}
                  className="input-lux pl-10"
                />
              </div>
              <select value={filters.category_id} onChange={set('category_id')} className="input-lux">
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={filters.grade} onChange={set('grade')} className="input-lux">
                <option value="">Semua Grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
              <select value={filters.sort} onChange={set('sort')} className="input-lux">
                <option value="newest">Terbaru</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>
            <label className="mt-3 inline-flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={set('in_stock')}
                className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
              />
              <span className="group-hover:text-primary transition-colors">Hanya yang tersedia (stok &gt; 0)</span>
            </label>
          </div>
        </Reveal>

        {/* List */}
        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-lux overflow-hidden">
                <div className="skeleton aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-5 w-2/3 rounded" />
                  <div className="skeleton h-4 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Reveal>
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">🍊</div>
              <p className="text-gray-500 text-lg">Tidak ada produk yang cocok.</p>
              <button onClick={() => setFilters({ search: '', category_id: '', grade: '', in_stock: false, sort: 'newest' })} className="mt-4 btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">
                Reset Filter
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <Reveal key={product.id} variant="up" delay={Math.min(i * 80, 400)}>
                <Link
                  to={`/oranges/${product.id}`}
                  className="card-lux card-img-zoom group block overflow-hidden"
                >
                  <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand relative">
                    {product.images?.[0]?.image_url ? (
                      <img src={product.images[0].image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/10 to-sand text-6xl">🍊</div>
                    )}
                    {product.grade && (
                      <div className="absolute top-3 right-3">
                        <span className="badge-gold">Grade {product.grade}</span>
                      </div>
                    )}
                    {Number(product.stock_kg) <= 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white">Stok Habis</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{product.category?.name}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-charcoal group-hover:text-primary transition-colors duration-300">
                      {product.name}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-primary">{formatRupiah(product.price_per_kg)}</span>
                      <span className="text-xs text-gray-400">/ kg</span>
                    </div>
                    {product.wholesale_price && (
                      <div className="mt-1 text-xs text-gray-500">
                        Grosir: <span className="font-bold text-secondary">{formatRupiah(product.wholesale_price)}</span>/kg
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      Stok {formatNumber(product.stock_kg)} kg · Min. {formatNumber(product.minimum_order_kg)} kg
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <Reveal>
            <div className="mt-10 text-center text-sm text-gray-500">
              Halaman {meta.current_page} dari {meta.last_page}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
