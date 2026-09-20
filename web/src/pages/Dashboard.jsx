import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import PaymentModal from '../components/PaymentModal';
import { useI18n } from '../i18n';
import siteConfig from '../config/site';

// Mapping status → translation key + class badge.
const ORDER_STATUS = {
  pending: { key: 'dashboard.status.pending', cls: 'badge-orange' },
  confirmed: { key: 'dashboard.status.confirmed', cls: 'badge-green' },
  processing: { key: 'dashboard.status.processing', cls: 'badge-gold' },
  completed: { key: 'dashboard.status.completed', cls: 'badge-green' },
  cancelled: { key: 'dashboard.status.cancelled', cls: 'badge-orange' },
};
const RENTAL_STATUS = {
  pending: { key: 'dashboard.status.pending', cls: 'badge-orange' },
  confirmed: { key: 'dashboard.status.confirmed', cls: 'badge-green' },
  active: { key: 'dashboard.status.active', cls: 'badge-green' },
  completed: { key: 'dashboard.status.completed', cls: 'badge-gold' },
  cancelled: { key: 'dashboard.status.cancelled', cls: 'badge-orange' },
};
const TRUCK_ORDER_STATUS = {
  pending: { key: 'dashboard.status.pending', cls: 'badge-orange' },
  confirmed: { key: 'dashboard.status.confirmed', cls: 'badge-green' },
  processing: { key: 'dashboard.status.processing', cls: 'badge-gold' },
  completed: { key: 'dashboard.status.completed', cls: 'badge-green' },
  cancelled: { key: 'dashboard.status.cancelled', cls: 'badge-orange' },
};
const PAYMENT_BADGE = {
  unpaid: { key: 'dashboard.payment_status.unpaid', cls: 'badge-orange' },
  pending: { key: 'dashboard.payment_status.pending', cls: 'badge-gold' },
  failed: { key: 'dashboard.payment_status.failed', cls: 'badge-orange' },
  paid: { key: 'dashboard.payment_status.paid', cls: 'badge-green' },
  refunded: { key: 'dashboard.payment_status.refunded', cls: 'badge-gold' },
};

function StatusBadge({ map, value }) {
  const { t } = useI18n();
  const s = map[value];
  return <span className={s?.cls || 'badge-gold'}>{s ? t(s.key) : value}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();
  const role = user?.role?.name;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payable, setPayable] = useState(null); // { id, label, total } untuk popup bayar

  // Redirect admin/seller roles to admin panel — but AFTER all hooks are declared
  const isAdminOrSeller = ['admin', 'sales', 'truck_seller', 'orange_seller'].includes(role);

  useEffect(() => {
    if (isAdminOrSeller) return;
    fetchDashboard().then(setStats).catch(() => setError(t('dashboard.load_failed'))).finally(() => setLoading(false));
  }, [isAdminOrSeller]);

  // Redirect AFTER hooks are all declared
  if (isAdminOrSeller) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white/5 backdrop-blur-sm">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/20 rounded-3xl p-8 backdrop-blur-sm text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">{t('dashboard.please_login')}</h2>
            <p className="text-gray-600 mb-6">
              {t('dashboard.please_login_desc')}
            </p>
            <Link to="/login" className="btn-lux rounded-full px-8 py-3.5 text-sm font-bold tracking-wide">
              {t('dashboard.login_now')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="py-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" /><p className="mt-4 text-gray-500">{t('dashboard.loading')}</p></div>;

  const summary = stats?.summary || {};
  const orders = stats?.recent_orders || [];
  const rentals = stats?.recent_rentals || [];
  const truckOrders = stats?.recent_truck_orders || [];
  const wishlists = stats?.recent_wishlists || [];

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">{t('dashboard.greeting', { name: user?.name })}</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">{t('dashboard.desc', { name: siteConfig.company.name })}</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {error && <Reveal><div className="mb-6 alert-lux-error">{error}</div></Reveal>}

        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>, label: t('dashboard.orders'), value: summary.orders_total ?? 0, to: '/orders' },
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>, label: t('dashboard.rent_truck'), value: summary.rentals_total ?? 0, to: '/rental' },
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>, label: t('dashboard.wishlist'), value: summary.wishlist_total ?? 0, to: '/trucks' },
            ].map((item, i) => (
              <Reveal key={item.label} variant="up" delay={i * 80}>
                <Link to={item.to} className="stat-card card-lux !rounded-2xl p-6 block group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{item.label}</p>
                      <p className="mt-1 text-3xl font-extrabold text-primary">{item.value}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">{item.icon}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <Reveal><h2 className="font-display text-xl font-bold text-primary mb-4">{t('dashboard.latest_orders')}</h2></Reveal>
            {orders.length === 0 ? (
              <Reveal delay={100}><p className="text-sm text-gray-400">{t('dashboard.no_orders')} <Link to="/oranges" className="font-bold text-secondary hover:underline">{t('dashboard.buy_oranges_now')}</Link></p></Reveal>
            ) : (
              <div className="space-y-3">
                {orders.map((order, i) => (
                  <Reveal key={order.id} variant="up" delay={i * 60}>
                    <div className="card-lux p-4 !rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-charcoal text-sm">{order.order_number}</div>
                          <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })} · {t('orders.item_count', { count: order.items?.length ?? 0 })}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-primary text-sm">{formatRupiah(order.total)}</div>
                          <div className="mt-1"><StatusBadge map={ORDER_STATUS} value={order.status} /></div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <section>
            <Reveal><h2 className="font-display text-xl font-bold text-primary mb-4">{t('dashboard.truck_orders')}</h2></Reveal>
            {truckOrders.length === 0 ? (
              <Reveal delay={100}><p className="text-sm text-gray-400">{t('dashboard.no_truck_orders')} <Link to="/trucks" className="font-bold text-secondary hover:underline">{t('dashboard.browse_trucks')}</Link></p></Reveal>
            ) : (
              <div className="space-y-3">
                {truckOrders.map((to, i) => {
                  const canPay = to.payment_status !== 'paid' && to.status !== 'cancelled';
                  return (
                    <Reveal key={to.id} variant="up" delay={i * 60}>
                      <div className="card-lux p-4 !rounded-xl">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-charcoal text-sm truncate">{to.truck?.brand} {to.truck?.model} <span className="font-normal text-gray-400">· {to.order_number}</span></div>
                            <div className="text-xs text-gray-400">{new Date(to.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <StatusBadge map={TRUCK_ORDER_STATUS} value={to.status} />
                              <span className={(PAYMENT_BADGE[to.payment_status] || {}).cls || 'badge-gold'}>{PAYMENT_BADGE[to.payment_status] ? t(PAYMENT_BADGE[to.payment_status].key) : to.payment_status}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-primary text-sm">{formatRupiah(to.amount)}</div>
                            {canPay && (
                              <button
                                onClick={() => setPayable({ id: to.id, label: t('dashboard.buy_label', { brand: to.truck?.brand, model: to.truck?.model }), order_number: to.order_number, total: to.amount })}
                                className="mt-2 btn-lux rounded-xl px-4 py-2 text-xs font-bold"
                              >
                                {t('dashboard.pay_now')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <Reveal><h2 className="font-display text-xl font-bold text-primary mb-4">{t('dashboard.latest_rentals')}</h2></Reveal>
            {rentals.length === 0 ? (
              <Reveal delay={100}><p className="text-sm text-gray-400">{t('dashboard.no_rentals')} <Link to="/rental" className="font-bold text-secondary hover:underline">{t('dashboard.rent_now')}</Link></p></Reveal>
            ) : (
              <div className="space-y-3">
                {rentals.map((rental, i) => (
                  <Reveal key={rental.id} variant="up" delay={i * 60}>
                    <div className="card-lux p-4 !rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-charcoal text-sm">{rental.truck?.brand} {rental.truck?.model}</div>
                          <div className="text-xs text-gray-400">{rental.start_date} → {rental.end_date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-primary text-sm">{formatRupiah(rental.total_price)}</div>
                          <div className="mt-1"><StatusBadge map={RENTAL_STATUS} value={rental.status} /></div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>

        <Reveal>
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-primary mb-4">{t('dashboard.truck_wishlist')}</h2>
            {wishlists.length === 0 ? (
              <p className="text-sm text-gray-400">{t('dashboard.no_wishlist')} <Link to="/trucks" className="font-bold text-secondary hover:underline">{t('dashboard.explore_catalog')}</Link></p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlists.map((truck) => (
                  <Link key={truck.id} to={`/trucks/${truck.id}`} className="card-lux card-img-zoom overflow-hidden">
                    <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand">
                      {truck.images?.[0]?.image_url ? (
                        <img src={truck.images[0].image_url} alt={`${truck.brand} ${truck.model}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/10 to-sand text-4xl">🚛</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-gray-400">{truck.year}</div>
                      <div className="mt-0.5 font-bold text-charcoal">{truck.brand} {truck.model}</div>
                      <div className="mt-1 font-extrabold text-primary text-sm">{formatRupiah(truck.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </Reveal>
      </div>

      {payable && (
        <PaymentModal
          payable={payable}
          type="truck_order"
          onClose={() => {
            setPayable(null);
            if (!isAdminOrSeller) fetchDashboard().then(setStats).catch(() => {});
          }}
          onPaid={() => {
            if (!isAdminOrSeller) fetchDashboard().then(setStats).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
