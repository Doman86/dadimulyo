import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchOrder } from '../api/orders';
import { deletePayment } from '../api/payments';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import PaymentModal from '../components/PaymentModal';
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
const PAYMENT_METHODS = {
  online: 'orders.payment_method.online',
  dp_online: 'orders.payment_method.dp_online',
  cod: 'orders.payment_method.cod',
  face_to_face: 'orders.payment_method.face_to_face',
  transfer: 'orders.payment_method.transfer',
};
const MANUAL_PAYMENT_STATUS = {
  pending: { key: 'orders.manual_payment_status.pending', cls: 'badge-gold' },
  paid: { key: 'orders.manual_payment_status.paid', cls: 'badge-green' },
  rejected: { key: 'orders.manual_payment_status.rejected', cls: 'badge-orange' },
  failed: { key: 'orders.manual_payment_status.failed', cls: 'badge-orange' },
};
const DELIVERY_STATUS = {
  pending: { key: 'orders.delivery_status.pending', cls: 'badge-orange' },
  assigned: { key: 'orders.delivery_status.assigned', cls: 'badge-green' },
  in_transit: { key: 'orders.delivery_status.in_transit', cls: 'badge-gold' },
  delivered: { key: 'orders.delivery_status.delivered', cls: 'badge-green' },
  cancelled: { key: 'orders.delivery_status.cancelled', cls: 'badge-orange' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const { t, dateLocale } = useI18n();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false);
    fetchOrder(id).then((d) => { if (!cancelled) setOrder(d); }).catch(() => { if (!cancelled) setNotFound(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Setelah checkout, langsung tawarkan pembayaran (dari Checkout.jsx: state.payNow).
  useEffect(() => {
    if (location.state?.payNow && order && order.payment_status === 'unpaid') {
      setShowPayModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state, order]);

  if (loading) return <div className="py-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" /><p className="mt-4 text-gray-500">{t('orders.loading')}</p></div>;
  if (notFound || !order) return <div className="py-20 text-center"><p className="text-gray-500">{t('orders.not_found')}</p><Link to="/orders" className="mt-3 inline-flex btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">            {t('orders.back_to_history')}
          </Link></div>;

  const isDp = order.payment_method === 'dp_online';
  const dpAmount = order.dp_amount ?? Math.round((order.total || 0) / 2);
  const remaining = isDp ? Math.max(0, (order.total || 0) - dpAmount) : 0;
  const canPay = order.payment_status !== 'paid' && order.payment_status !== 'pending' && order.status !== 'cancelled';
  const payments = order.payments || [];
  const delivery = order.delivery;
  const addr = order.shipping_address;

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link to="/orders" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            {t('orders.back_to_history')}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-charcoal">{order.order_number}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {t('orders.created_at', { date: new Date(order.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={(ORDER_STATUS[order.status] || {}).cls || 'badge-gold'}>{ORDER_STATUS[order.status] ? t(ORDER_STATUS[order.status].key) : order.status}</span>
              <span className={(PAYMENT_STATUS[order.payment_status] || {}).cls || 'badge-gold'}>{PAYMENT_STATUS[order.payment_status] ? t(PAYMENT_STATUS[order.payment_status].key) : order.payment_status}</span>
              {order.payment_method && (
                <span className="badge-gold">{PAYMENT_METHODS[order.payment_method] ? t(PAYMENT_METHODS[order.payment_method]) : order.payment_method}</span>
              )}
            </div>
          </div>
          {canPay && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setShowPayModal(true)} className="btn-lux rounded-xl px-8 py-3 text-sm font-bold">
                {isDp && order.payment_status === 'dp_paid' ? t('orders.pay_remaining') : t('orders.pay_now')}
              </button>
              {payments.some((p) => p.status === 'pending') && (
                <span className="inline-flex items-center rounded-xl bg-gold/10 px-4 py-3 text-xs font-medium text-charcoal">
                  {t('orders.proof_verifying')}
                </span>
              )}
            </div>
          )}
        </Reveal>

        <Reveal variant="up" delay={100}>
          <section className="mt-8 card-lux !rounded-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3"><h2 className="font-display font-bold text-charcoal">{t('orders.items')}</h2></div>
            <div className="divide-y divide-gray-50">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-bold text-charcoal">{item.product_name || t('orders.product')}</div>
                    <div className="text-xs text-gray-400">{formatNumber(item.quantity_kg)} kg × {formatRupiah(item.price_per_kg)}</div>
                  </div>
                  <div className="font-bold text-primary">{formatRupiah(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">{t('common.subtotal')}</span><span className="font-bold text-charcoal">{formatRupiah(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('common.shipping')}</span><span className="font-bold text-charcoal">{formatRupiah(order.shipping_cost)}</span></div>
              {isDp && (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">{t('orders.dp_paid')}</span><span className="font-bold text-charcoal">{formatRupiah(dpAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('orders.dp_remaining')}</span><span className="font-bold text-charcoal">{formatRupiah(remaining)}</span></div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-charcoal">{t('common.total')}</span><span className="text-lg font-extrabold text-primary">{formatRupiah(order.total)}</span></div>
            </div>
          </section>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal variant="left">
            <section className="card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">{t('orders.shipping_address')}</h2>
              {addr ? (
                <div className="mt-3 text-sm">
                  <div className="font-bold text-charcoal">{addr.recipient_name} {addr.phone && <span className="font-normal text-gray-400">· {addr.phone}</span>}</div>
                  <p className="mt-1 text-gray-500 whitespace-pre-line">{addr.address}{addr.city && <>, {addr.city}</>}{addr.province && <>, {addr.province}</>}{addr.postal_code && <> {addr.postal_code}</>}</p>
                </div>
              ) : <p className="mt-3 text-sm text-gray-400">{t('orders.no_address')}</p>}
            </section>
          </Reveal>
          <Reveal variant="right">
            <section className="card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">{t('orders.delivery')}</h2>
              {delivery ? (
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={(DELIVERY_STATUS[delivery.status] || {}).cls || 'badge-gold'}>{DELIVERY_STATUS[delivery.status] ? t(DELIVERY_STATUS[delivery.status].key) : delivery.status}</span>
                    {delivery.truck && <span className="text-gray-500">🚛 {delivery.truck.brand} {delivery.truck.model}</span>}
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    {delivery.driver && <div className="flex justify-between"><dt className="text-gray-400">{t('orders.driver')}</dt><dd className="font-bold text-charcoal">{delivery.driver.name}</dd></div>}
                    {delivery.pickup_address && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">{t('orders.pickup_from')}</dt><dd className="text-right text-charcoal">{delivery.pickup_address}</dd></div>}
                    {delivery.destination_address && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">{t('orders.destination')}</dt><dd className="text-right text-charcoal">{delivery.destination_address}</dd></div>}
                    {delivery.scheduled_at && <div className="flex justify-between"><dt className="text-gray-400">{t('orders.schedule')}</dt><dd className="font-bold text-charcoal">{delivery.scheduled_at}</dd></div>}
                    {delivery.shipping_cost > 0 && <div className="flex justify-between"><dt className="text-gray-400">{t('common.shipping')}</dt><dd className="font-bold text-charcoal">{formatRupiah(delivery.shipping_cost)}</dd></div>}
                    {delivery.notes && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">{t('orders.notes')}</dt><dd className="text-right text-charcoal">{delivery.notes}</dd></div>}
                  </dl>
                </div>
              ) : <p className="mt-3 text-sm text-gray-400">{t('orders.no_delivery')}</p>}
            </section>
          </Reveal>
        </div>

        {payments.length > 0 && (
          <Reveal>
            <section className="mt-6 card-lux !rounded-2xl overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-3"><h2 className="font-display font-bold text-charcoal">{t('orders.payment_history')}</h2></div>
              <div className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold capitalize text-charcoal">{p.payment_method}</span>
                        <span className={(MANUAL_PAYMENT_STATUS[p.status] || {}).cls || 'badge-gold'}>{MANUAL_PAYMENT_STATUS[p.status] ? t(MANUAL_PAYMENT_STATUS[p.status].key) : p.status}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {formatRupiah(p.amount)} · {new Date(p.created_at).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.proof_url && (
                        <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-secondary hover:underline">{t('orders.view_proof')}</a>
                      )}
                      {p.status === 'pending' && canPay && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(t('orders.delete_proof_confirm'))) return;
                            setDeletingPaymentId(p.id);
                            try {
                              await deletePayment(order.id, p.id);
                              setOrder((prev) => ({ ...prev, payments: payments.filter((x) => x.id !== p.id) }));
                            } catch (err) {
                              alert(err.response?.data?.message || t('orders.delete_proof_failed'));
                            } finally {
                              setDeletingPaymentId(null);
                            }
                          }}
                          disabled={deletingPaymentId === p.id}
                          className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50"
                        >
                          {deletingPaymentId === p.id ? t('orders.deleting') : t('orders.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {order.notes && (
          <Reveal>
            <section className="mt-6 card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">{t('orders.order_notes')}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-500">{order.notes}</p>
            </section>
          </Reveal>
        )}
      </div>

      {showPayModal && (
        <PaymentModal
          payable={{
            id: order.id,
            order_number: order.order_number,
            total: isDp && order.payment_status === 'dp_paid' ? remaining : order.total,
            label: isDp ? (order.payment_status === 'dp_paid' ? t('orders.pay_remaining') : t('orders.dp_paid')) : undefined,
          }}
          type="order"
          onClose={() => setShowPayModal(false)}
          onPaid={(_id, opts) => {
            fetchOrder(id).then(setOrder).catch(() => {});
            if (!opts?.keepOpen) setShowPayModal(false);
          }}
        />
      )}
    </div>
  );
}
