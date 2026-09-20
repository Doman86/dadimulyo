import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/orders';
import { formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';

// Mapping status → translation key + class badge.
const ORDER_STATUS = {
  pending: { key: 'orders.status.pending', cls: 'badge-orange' },
  confirmed: { key: 'orders.status.confirmed', cls: 'badge-green' },
  processing: { key: 'orders.status.processing', cls: 'badge-gold' },
  shipping: { key: 'orders.status.shipping', cls: 'badge-gold' },
  delivered: { key: 'orders.status.delivered', cls: 'badge-green' },
  completed: { key: 'orders.status.completed', cls: 'badge-green' },
  cancelled: { key: 'orders.status.cancelled', cls: 'badge-orange' },
};

const PAYMENT_STATUS = {
  unpaid: { key: 'orders.payment_status.unpaid', cls: 'badge-orange' },
  pending: { key: 'orders.payment_status.pending', cls: 'badge-gold' },
  dp_paid: { key: 'orders.payment_status.dp_paid', cls: 'badge-gold' },
  failed: { key: 'orders.payment_status.failed', cls: 'badge-orange' },
  paid: { key: 'orders.payment_status.paid', cls: 'badge-green' },
  refunded: { key: 'orders.payment_status.refunded', cls: 'badge-gold' },
};

export default function Orders() {
  const { t, dateLocale } = useI18n();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders({ per_page: 20 })
      .then((result) => { setOrders(result.data); setMeta(result.meta || {}); })
      .catch(() => setError(t('orders.load_failed')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">{t('orders.history')}</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">{t('orders.history_desc')}</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {error && <Reveal><div className="mb-6 alert-lux-error">{error}</div></Reveal>}

        {loading ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => <div key={i} className="card-lux p-5 !rounded-xl"><div className="skeleton h-4 w-1/3 mb-3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>)}
          </div>
        ) : orders.length === 0 ? (
          <Reveal>
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">{t('orders.empty')}</p>
              <Link to="/oranges" className="mt-4 inline-flex btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">{t('orders.shop_now')}</Link>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <Reveal key={order.id} variant="up" delay={Math.min(i * 60, 300)}>
                <Link to={`/orders/${order.id}`} className="card-lux block p-5 !rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-charcoal">{order.order_number}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {t('orders.item_count', { count: order.items?.length ?? 0 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-primary">{formatRupiah(order.total)}</div>
                      <div className="mt-1 flex justify-end gap-1.5">
                        <span className={(ORDER_STATUS[order.status] || {}).cls || 'badge-gold'}>{ORDER_STATUS[order.status] ? t(ORDER_STATUS[order.status].key) : order.status}</span>
                        <span className={(PAYMENT_STATUS[order.payment_status] || {}).cls || 'badge-gold'}>{PAYMENT_STATUS[order.payment_status] ? t(PAYMENT_STATUS[order.payment_status].key) : order.payment_status}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <Reveal><div className="mt-6 text-center text-sm text-gray-400">{t('common.page_of', { current: meta.current_page, last: meta.last_page })}</div></Reveal>
        )}
      </div>
    </div>
  );
}
