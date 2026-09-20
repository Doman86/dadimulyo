import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrucks, fetchCategories } from '../api/trucks';
import { fetchOranges, fetchOrangeCategories } from '../api/oranges';
import { fetchSiteStats } from '../api/stats';
import { formatRupiah, formatNumber } from '../utils/format';
import Reveal from '../components/Reveal';
import useCountUp, { useInViewOnce } from '../hooks/useCountUp';
import { useI18n } from '../i18n';
import siteConfig from '../config/site';

function StatCounter({ target, suffix = '', label }) {
  const [ref, inView] = useInViewOnce();
  const value = useCountUp(target, { duration: 2000, start: inView });

  return (
    <div ref={ref} className="stat-card bg-white/5 backdrop-blur-sm">
      <div className="text-4xl font-extrabold text-gold-gradient font-display">
        {formatNumber(value)}{suffix}
      </div>
      <div className="mt-1.5 text-sm text-white/60 font-medium">{label}</div>
    </div>
  );
}

const FALLBACK_MARQUEE = [];

function TrustMarquee({ items, fallback }) {
  const marqueeItems = items.length > 0 ? items : fallback;
  return (
    <div className="overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-4">
      <div className="marquee-track">
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <span key={i} className="mx-6 flex items-center gap-2 whitespace-nowrap text-sm text-white/40 font-medium">
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [trucks, setTrucks] = useState([]);
  const [oranges, setOranges] = useState([]);
  const [stats, setStats] = useState(null);
  const [marqueeItems, setMarqueeItems] = useState([]);

  const fallbackMarquee = [
    t('home.marquee_trucks'),
    t('home.marquee_oranges'),
    t('home.marquee_delivery'),
    t('home.marquee_price'),
    t('home.marquee_booking'),
    t('home.marquee_photo'),
    t('home.marquee_rent'),
    t('home.marquee_support'),
  ];

  useEffect(() => {
    fetchTrucks({ per_page: 6, sort: 'newest' })
      .then((result) => setTrucks(result.data || []))
      .catch(() => {});
    fetchOranges({ per_page: 6, in_stock: 1 })
      .then((result) => setOranges(result.data || []))
      .catch(() => {});
    fetchSiteStats()
      .then((data) => setStats(data))
      .catch(() => {});

    Promise.allSettled([fetchCategories(), fetchOrangeCategories()])
      .then(([truckCats, orangeCats]) => {
        const truckItems = (truckCats.value || []).map((c) => c.name);
        const orangeItems = (orangeCats.value || []).map((c) => c.name);
        setMarqueeItems([...truckItems, ...orangeItems, siteConfig.serviceArea]);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-primary-dark via-forest to-pine">
        {/* Orbs */}
        <div className="orb orb-1 -top-40 -left-40" />
        <div className="orb orb-2 top-20 right-[-100px]" />
        <div className="orb orb-3 bottom-0 left-1/3" />
        {/* Grid bg */}
        <div className="hero-grid-bg absolute inset-0" />
        {/* Noise */}
        <div className="noise-overlay absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 w-full">
          <div className="max-w-3xl">
            <Reveal variant="up" delay={100}>
              <span className="badge-lux mb-6 inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-light animate-pulse" />
                {siteConfig.address.short}
              </span>
            </Reveal>

            <Reveal variant="up" delay={250}>
              <h1 className="font-display text-5xl font-extrabold leading-[1.1] text-white md:text-7xl">
                {t('home.hero_title_1')}{' '}
                <span className="text-gold-gradient">{t('home.hero_title_2')}</span>{' '}
                {t('home.hero_title_3')} {siteConfig.address.city}
              </h1>
            </Reveal>

            <Reveal variant="up" delay={400}>
              <p className="mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
                {t('home.hero_subtitle', {
                  name: siteConfig.company.name,
                  address: siteConfig.address.full,
                })}
              </p>
            </Reveal>

            <Reveal variant="up" delay={550}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/trucks" className="btn-lux rounded-full px-8 py-3.5 text-sm font-bold tracking-wide">
                  {t('home.view_truck_catalog')}
                </Link>
                <Link to="/oranges" className="btn-ghost-lux rounded-full px-8 py-3.5 text-sm font-bold text-white tracking-wide">
                  {t('home.buy_fresh_oranges')}
                </Link>
                <Link to="/dadi-mulyo.apk" className="btn-lux rounded-full px-8 py-3.5 text-sm font-bold tracking-wide" target="_blank" rel="noopener noreferrer">
                  {t('home.download_apk')}
                </Link>
                <Link to="/rental" className="btn-ghost-lux rounded-full px-8 py-3.5 text-sm font-bold text-white tracking-wide">
                  {t('home.rent_truck')}
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Scroll indicator */}
          <Reveal variant="up" delay={800} className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="scroll-indicator" />
          </Reveal>
        </div>
      </section>

      {/* ============ TRUST MARQUEE ============ */}
      <TrustMarquee items={marqueeItems} fallback={fallbackMarquee} />

      {/* ============ STATS ============ */}
      <section className="relative bg-gradient-to-b from-forest to-primary-dark py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCounter target={stats?.trucks_for_sale ?? 0} suffix="+" label={t('home.stats_trucks_for_sale')} />
              <StatCounter target={stats?.trucks_for_rent ?? 0} suffix="+" label={t('home.stats_trucks_for_rent')} />
              <StatCounter target={stats?.oranges_in_stock ?? 0} suffix="+" label={t('home.stats_oranges_in_stock')} />
              <StatCounter target={stats?.orange_stock_kg_total ?? 0} suffix=" kg" label={t('home.stats_orange_stock_kg')} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURED TRUCKS ============ */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="section-header">
              <span className="section-label centered">{t('home.our_catalog')}</span>
              <h2 className="mt-3">{t('home.latest_trucks')}</h2>
              <p>{t('home.latest_trucks_desc')}</p>
            </div>
          </Reveal>

          {trucks.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
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
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trucks.map((truck, i) => (
                <Reveal key={truck.id} variant="up" delay={i * 100}>
                  <Link
                    to={`/trucks/${truck.id}`}
                    className="card-lux card-img-zoom group block overflow-hidden"
                  >
                    <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand">
                      {truck.images?.[0]?.image_url ? (
                        <img
                          src={truck.images[0].image_url}
                          alt={`${truck.brand} ${truck.model}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/10 to-sand text-5xl">
                          🚛
                        </div>
                      )}
                      {/* Price overlay */}
                      <div className="absolute bottom-3 left-3">
                        <span className="glass-dark rounded-full px-3.5 py-1.5 text-xs font-bold text-gold-light backdrop-blur-md">
                          {formatRupiah(truck.price)}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="badge-green text-[0.65rem]">{truck.year}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{truck.category?.name || t('nav.trucks')}</span>
                      </div>
                      <h3 className="mt-2.5 text-lg font-bold text-charcoal group-hover:text-primary transition-colors duration-300">
                        {truck.brand} {truck.model}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        {truck.location}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={200}>
            <div className="mt-12 text-center">
              <Link
                to="/trucks"
                className="btn-dark-lux inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold"
              >
                {t('home.view_all_trucks')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURED ORANGES ============ */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="mx-auto max-w-7xl px-4 relative">
          <Reveal>
            <div className="section-header">
              <span className="section-label centered">{t('home.fresh_from')} {siteConfig.address.city}</span>
              <h2 className="mt-3">{t('home.selected_oranges')}</h2>
              <p>{t('home.selected_oranges_desc', { city: siteConfig.address.city })}</p>
            </div>
          </Reveal>

          {oranges.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
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
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {oranges.map((product, i) => (
                <Reveal key={product.id} variant="up" delay={i * 100}>
                  <Link
                    to={`/oranges/${product.id}`}
                    className="card-lux card-img-zoom group block overflow-hidden"
                  >
                    <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand relative">
                      {product.images?.[0]?.image_url ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/10 to-sand text-6xl">
                          🍊
                        </div>
                      )}
                      {product.grade && (
                        <div className="absolute top-3 right-3">
                          <span className="badge-gold">Grade {product.grade}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{product.category?.name}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-charcoal group-hover:text-primary transition-colors duration-300">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-primary">{formatRupiah(product.price_per_kg)}</span>
                        <span className="text-xs text-gray-400">/ kg</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {t('home.stock_kg', { value: formatNumber(product.stock_kg) })}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={200}>
            <div className="mt-12 text-center">
              <Link
                to="/oranges"
                className="btn-dark-lux inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold"
              >
                {t('home.view_all_oranges')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ WHY DADI MULYO ============ */}
      <section className="relative bg-cream py-20 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gold/5 blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="mx-auto max-w-7xl px-4 relative">
          <Reveal>
            <div className="section-header">
              <span className="section-label centered">{t('home.our_advantages')}</span>
              <h2 className="mt-3">{t('home.why_us', { name: siteConfig.company.name })}</h2>
              <p>{t('home.why_us_desc')}</p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" />
                  </svg>
                ),
                title: t('home.why_trucks_title'),
                desc: t('home.why_trucks_desc'),
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ),
                title: t('home.why_orange_title'),
                desc: t('home.why_orange_desc', { city: siteConfig.address.city }),
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: t('home.why_delivery_title'),
                desc: t('home.why_delivery_desc'),
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
                title: t('home.why_price_title'),
                desc: t('home.why_price_desc'),
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
                title: t('home.why_online_title'),
                desc: t('home.why_online_desc'),
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
                title: t('home.why_sales_title'),
                desc: t('home.why_sales_desc'),
              },
            ].map((item, i) => (
              <Reveal key={item.title} variant="zoom" delay={i * 80}>
                <div className="card-lux group p-6 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-forest/10 to-gold/10 text-primary group-hover:from-gold/20 group-hover:to-gold/5 transition-all duration-500">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-forest to-pine py-20">
        <div className="orb orb-1 -top-20 -right-20" />
        <div className="orb orb-3 bottom-[-100px] left-10" />
        <div className="hero-grid-bg absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="badge-lux">{t('home.ready_to_shop')}</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h2 className="mt-5 font-display text-4xl font-extrabold text-white md:text-5xl">
              {t('home.explore_cta_1')} <span className="text-gold-gradient">{t('home.explore_cta_2')}</span>
            </h2>
          </Reveal>
          <Reveal variant="up" delay={300}>
            <p className="mt-5 text-white/50 text-lg max-w-lg mx-auto">
              {t('home.explore_desc')}
            </p>
          </Reveal>
          <Reveal variant="up" delay={450}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/trucks" className="btn-lux rounded-full px-8 py-3.5 text-sm font-bold tracking-wide">
                {t('home.view_trucks')}
              </Link>
              <Link to="/oranges" className="btn-ghost-lux rounded-full px-8 py-3.5 text-sm font-bold text-white tracking-wide">
                {t('home.buy_oranges')}
              </Link>
              <Link to="/contact" className="btn-ghost-lux rounded-full px-8 py-3.5 text-sm font-bold text-white tracking-wide">
                {t('home.contact_us')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
