import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { fetchTrucks } from '../api/trucks';
import { BULK_THRESHOLD_KG, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';
import siteConfig from '../config/site';

const EMPTY_ADDRESS = {
  recipient_name: '',
  phone: '',
  address: '',
  village: '',
  district: '',
  city: '',
  province: '',
  postal_code: '',
};

// Metode pembayaran — sama dengan pilihan di mobile (konsisten lintas platform).
// Label memakai translation key agar bisa diterjemahkan.
const PAYMENT_METHODS = [
  { value: 'online', labelKey: 'checkout.pay_online', descKey: 'checkout.pay_online_desc' },
  { value: 'dp_online', labelKey: 'checkout.dp_online', descKey: 'checkout.dp_online_desc' },
  { value: 'cod', labelKey: 'checkout.cod', descKey: 'checkout.cod_desc' },
  { value: 'face_to_face', labelKey: 'checkout.face_to_face', descKey: 'checkout.face_to_face_desc' },
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { t } = useI18n();

  const [trucks, setTrucks] = useState([]);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');
  const [needDelivery, setNeedDelivery] = useState(false);
  const [delivery, setDelivery] = useState({ truck_id: '', scheduled_at: '', shipping_cost: '' });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/checkout' } }); return; }
    if (items.length === 0) { navigate('/cart', { replace: true }); }
  }, [user, items.length, navigate]);

  useEffect(() => {
    fetchTrucks({ per_page: 50, status: 'available' }).then((result) => setTrucks(result.data)).catch(() => {});
  }, []);

  const set = (key) => (e) => setAddress({ ...address, [key]: e.target.value });
  const setDeliveryField = (key) => (e) => setDelivery({ ...delivery, [key]: e.target.value });
  const shippingCost = delivery.shipping_cost ? Number(delivery.shipping_cost) : 0;
  const total = subtotal + shippingCost;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      items: items.map((item) => ({ orange_product_id: item.product_id, quantity_kg: item.quantity_kg })),
      address,
      payment_method: paymentMethod,
      notes: notes || undefined,
    };
    if (needDelivery) {
      payload.shipping_cost = shippingCost;
      payload.delivery = { truck_id: delivery.truck_id ? Number(delivery.truck_id) : undefined, scheduled_at: delivery.scheduled_at || undefined, notes: notes || undefined };
    }
    try {
      const order = await createOrder(payload);
      clearCart();
      // Langsung tawarkan pembayaran online setelah pesanan dibuat
      // (jika metode yang dipilih adalah online).
      navigate(`/orders/${order.id}`, { state: { payNow: paymentMethod === 'online' } });
    } catch (err) {
      const firstError = err.response?.data?.errors;
      setError(firstError ? Object.values(firstError)[0]?.[0] : err.response?.data?.message || t('checkout.create_failed'));
      setSubmitting(false);
    }
  }

  if (items.length === 0) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-gray-500">{t('checkout.empty_cart')}</p>
      <Link to="/oranges" className="mt-3 inline-flex btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">{t('checkout.back_to_shop')}</Link>
    </div>
  );

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">{t('checkout.title')}</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">{t('checkout.desc')}</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error && <Reveal><div className="mb-6 alert-lux-error">{error}</div></Reveal>}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Reveal>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">{t('checkout.shipping_address')}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><label className="label-lux">{t('checkout.recipient_name')}</label><input required value={address.recipient_name || user?.name || ''} onChange={set('recipient_name')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.phone_wa')}</label><input required type="tel" value={address.phone || user?.phone || ''} onChange={set('phone')} className="input-lux" /></div>
                  <div className="sm:col-span-2"><label className="label-lux">{t('checkout.full_address')}</label><textarea required rows={3} value={address.address} onChange={set('address')} placeholder={t('checkout.address_placeholder')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.village')}</label><input value={address.village} onChange={set('village')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.district')}</label><input value={address.district} onChange={set('district')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.city')}</label><input required value={address.city} onChange={set('city')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.province')}</label><input value={address.province} onChange={set('province')} className="input-lux" /></div>
                  <div><label className="label-lux">{t('checkout.postal_code')}</label><input value={address.postal_code} onChange={set('postal_code')} className="input-lux" /></div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={100}>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">{t('checkout.delivery')}</h2>
                <label className="mt-3 flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer group">
                  <input type="checkbox" checked={needDelivery} onChange={(e) => setNeedDelivery(e.target.checked)} className="h-4 w-4 rounded border-gray-300 accent-primary" />
                  <span className="group-hover:text-primary transition-colors">{t('checkout.need_delivery', { name: siteConfig.company.name })}</span>
                </label>
                {needDelivery && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div><label className="label-lux">{t('checkout.choose_truck')}</label><select value={delivery.truck_id} onChange={setDeliveryField('truck_id')} className="input-lux"><option value="">{t('checkout.no_special_truck')}</option>{trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.brand} {truck.model} · {truck.location || '-'}</option>)}</select></div>
                    <div><label className="label-lux">{t('checkout.delivery_schedule')}</label><input type="date" min={new Date().toISOString().split('T')[0]} value={delivery.scheduled_at} onChange={setDeliveryField('scheduled_at')} className="input-lux" /></div>
                    <div className="sm:col-span-2"><label className="label-lux">{t('checkout.shipping_estimate')}</label><input type="number" min="0" value={delivery.shipping_cost} onChange={setDeliveryField('shipping_cost')} placeholder="0" className="input-lux" /><p className="mt-1 text-xs text-gray-400">{t('checkout.shipping_note')}</p></div>
                  </div>
                )}
              </section>
            </Reveal>

            <Reveal delay={200}>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">{t('checkout.payment_method')}</h2>
                <div className="mt-3 space-y-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${paymentMethod === m.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gold/60'}`}>
                      <input type="radio" name="payment_method" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} className="mt-1 h-4 w-4 accent-primary" />
                      <span>
                        <span className="block text-sm font-bold text-charcoal">{t(m.labelKey)}</span>
                        <span className="mt-0.5 block text-xs text-gray-400">{t(m.descKey)}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-gray-400">{t('checkout.status_note')}</p>
              </section>
            </Reveal>

            <Reveal delay={300}>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">{t('checkout.notes')}</h2>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('checkout.notes_placeholder')} className="input-lux mt-3" />
              </section>
            </Reveal>
          </div>

          <Reveal variant="right">
            <aside className="card-lux h-fit p-6 !rounded-2xl lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-primary">{t('checkout.order_summary')}</h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const price = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null ? item.wholesale_price : item.price_per_kg;
                  return (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate mr-2">{item.name} <span className="text-gray-300">× {formatNumber(item.quantity_kg)} kg</span></span>
                      <span className="font-bold text-charcoal shrink-0">{formatRupiah(price * item.quantity_kg)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="divider-gold my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('common.subtotal')}</span><span className="font-bold text-charcoal">{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('checkout.shipping')}</span><span className="font-bold text-charcoal">{needDelivery ? formatRupiah(shippingCost) : t('checkout.no_delivery')}</span></div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-charcoal">{t('common.total')}</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(total)}</span>
              </div>
              {paymentMethod === 'dp_online' && (
                <div className="mt-2 rounded-xl bg-gold/10 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-charcoal">{t('checkout.dp_paid_now')}</span>
                    <span className="font-extrabold text-primary">{formatRupiah(Math.round(total / 2))}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>{t('checkout.dp_remaining')}</span>
                    <span className="font-bold text-charcoal">{formatRupiah(total - Math.round(total / 2))}</span>
                  </div>
                </div>
              )}
              <button type="submit" disabled={submitting} className="mt-5 w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                {submitting ? t('common.processing') : t('checkout.create_order')}
              </button>
              <Link to="/cart" className="mt-3 block text-center text-sm font-medium text-secondary hover:underline">← {t('cart.title')}</Link>
            </aside>
          </Reveal>
        </form>
      </div>
    </div>
  );
}
