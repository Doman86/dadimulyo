import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchTrucks } from '../api/trucks';
import { formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';

export default function Trucks() {
  const { t } = useI18n();
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

    return () => { cancelled = true; };
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
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 -left-20 opacity-30" />
        <div className="orb orb-2 top-10 right-[-80px] opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">{t('trucks.full_catalog')}</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">{t('trucks.catalog')}</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">{t('trucks.catalog_desc')}</p>
          </Reveal>
          <Reveal variant="up" delay={350}>
            <Link to="/compare" className="mt-5 inline-flex items-center gap-2 btn-ghost-lux rounded-full px-6 py-2.5 text-sm font-bold text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              {t('trucks.compare')}
            </Link>
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
                  placeholder={t('trucks.search_placeholder')}
                  value={filters.search}
                  onChange={set('search')}
                  className="input-lux pl-10"
                />
              </div>
              <select value={filters.category_id} onChange={set('category_id')} className="input-lux">
                <option value="">{t('trucks.all_categories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={filters.condition} onChange={set('condition')} className="input-lux">
                <option value="">{t('trucks.all_conditions')}</option>
                <option value="baru">{t('trucks.condition_new')}</option>
                <option value="bekas">{t('trucks.condition_used')}</option>
              </select>
              <select value={filters.sort} onChange={set('sort')} className="input-lux">
                <option value="newest">{t('trucks.sort_newest')}</option>
                <option value="oldest">{t('trucks.sort_oldest')}</option>
                <option value="price_asc">{t('trucks.sort_price_asc')}</option>
                <option value="price_desc">{t('trucks.sort_price_desc')}</option>
              </select>
            </div>
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
        ) : trucks.length === 0 ? (
          <Reveal>
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">🚛</div>
              <p className="text-gray-500 text-lg">{t('trucks.empty')}</p>
              <button onClick={() => setFilters({ search: '', category_id: '', condition: '', sort: 'newest' })} className="mt-4 btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">
                {t('trucks.reset_filter')}
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck, i) => (
              <Reveal key={truck.id} variant="up" delay={Math.min(i * 80, 400)}>
                <Link
                  to={`/trucks/${truck.id}`}
                  className="card-lux card-img-zoom group block overflow-hidden"
                >
                  <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand relative">
                    {truck.images?.[0]?.image_url ? (
                      <img src={truck.images[0].image_url} alt={`${truck.brand} ${truck.model}`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/10 to-sand text-5xl">🚛</div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <span className="glass-dark rounded-full px-3.5 py-1.5 text-xs font-bold text-gold-light backdrop-blur-md">
                        {formatRupiah(truck.price)}
                      </span>
                    </div>
                    {truck.condition && (
                      <div className="absolute top-3 left-3">
                        <span className={truck.condition === 'baru' ? 'badge-green' : 'badge-orange'}>
                          {truck.condition === 'baru' ? t('trucks.condition_new') : t('trucks.condition_used')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{truck.year}</span>
                      <span>·</span>
                      <span>{truck.category?.name || t('nav.trucks')}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-charcoal group-hover:text-primary transition-colors duration-300">
                      {truck.brand} {truck.model}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>
                        {truck.transmission}
                      </span>
                      <span>·</span>
                      <span>{truck.fuel_type}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        {truck.location}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(truck); }}
                      className="mt-3 btn-outline-lux rounded-full px-4 py-1.5 text-xs font-bold"
                    >
                      {t('trucks.compare_button')}
                    </button>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <Reveal>
            <div className="mt-10 text-center text-sm text-gray-500">
              {t('common.page_of', { current: meta.current_page, last: meta.last_page })}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
