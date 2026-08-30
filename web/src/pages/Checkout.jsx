import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { fetchTrucks } from '../api/trucks';
import { BULK_THRESHOLD_KG, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
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

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();

  const [trucks, setTrucks] = useState([]);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');
  const [needDelivery, setNeedDelivery] = useState(false);
  const [delivery, setDelivery] = useState({ truck_id: '', scheduled_at: '', shipping_cost: '' });
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
      notes: notes || undefined,
    };
    if (needDelivery) {
      payload.shipping_cost = shippingCost;
      payload.delivery = { truck_id: delivery.truck_id ? Number(delivery.truck_id) : undefined, scheduled_at: delivery.scheduled_at || undefined, notes: notes || undefined };
    }
    try {
      const order = await createOrder(payload);
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const firstError = err.response?.data?.errors;
      setError(firstError ? Object.values(firstError)[0]?.[0] : err.response?.data?.message || 'Gagal membuat pesanan.');
      setSubmitting(false);
    }
  }

  if (items.length === 0) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-gray-500">Keranjang kosong.</p>
      <Link to="/oranges" className="mt-3 inline-flex btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">Kembali belanja</Link>
    </div>
  );

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">Checkout</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">Lengkapi alamat pengiriman dan opsi pengiriman.</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error && <Reveal><div className="mb-6 alert-lux-error">{error}</div></Reveal>}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Reveal>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">Alamat Pengiriman</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><label className="label-lux">Nama Penerima *</label><input required value={address.recipient_name || user?.name || ''} onChange={set('recipient_name')} className="input-lux" /></div>
                  <div><label className="label-lux">No. HP / WA *</label><input required type="tel" value={address.phone || user?.phone || ''} onChange={set('phone')} className="input-lux" /></div>
                  <div className="sm:col-span-2"><label className="label-lux">Alamat Lengkap *</label><textarea required rows={3} value={address.address} onChange={set('address')} placeholder="Nama jalan, nomor rumah, RT/RW, patokan..." className="input-lux" /></div>
                  <div><label className="label-lux">Kelurahan/Desa</label><input value={address.village} onChange={set('village')} className="input-lux" /></div>
                  <div><label className="label-lux">Kecamatan</label><input value={address.district} onChange={set('district')} className="input-lux" /></div>
                  <div><label className="label-lux">Kota/Kabupaten *</label><input required value={address.city} onChange={set('city')} className="input-lux" /></div>
                  <div><label className="label-lux">Provinsi</label><input value={address.province} onChange={set('province')} className="input-lux" /></div>
                  <div><label className="label-lux">Kode Pos</label><input value={address.postal_code} onChange={set('postal_code')} className="input-lux" /></div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={100}>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">Pengiriman</h2>
                <label className="mt-3 flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer group">
                  <input type="checkbox" checked={needDelivery} onChange={(e) => setNeedDelivery(e.target.checked)} className="h-4 w-4 rounded border-gray-300 accent-primary" />
                  <span className="group-hover:text-primary transition-colors">Saya butuh pengiriman menggunakan truck {siteConfig.company.name}</span>
                </label>
                {needDelivery && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div><label className="label-lux">Pilih Truck</label><select value={delivery.truck_id} onChange={setDeliveryField('truck_id')} className="input-lux"><option value="">Tanpa truck khusus</option>{trucks.map((t) => <option key={t.id} value={t.id}>{t.brand} {t.model} · {t.location || '-'}</option>)}</select></div>
                    <div><label className="label-lux">Jadwal Pengiriman</label><input type="date" min={new Date().toISOString().split('T')[0]} value={delivery.scheduled_at} onChange={setDeliveryField('scheduled_at')} className="input-lux" /></div>
                    <div className="sm:col-span-2"><label className="label-lux">Estimasi Ongkir (Rp)</label><input type="number" min="0" value={delivery.shipping_cost} onChange={setDeliveryField('shipping_cost')} placeholder="0" className="input-lux" /><p className="mt-1 text-xs text-gray-400">Biaya dikonfirmasi oleh admin; pembayaran dilakukan di lokasi/transfer.</p></div>
                  </div>
                )}
              </section>
            </Reveal>

            <Reveal delay={200}>
              <section className="card-lux p-6 !rounded-2xl">
                <h2 className="font-display text-lg font-bold text-charcoal">Catatan (opsional)</h2>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan untuk penjual / pengiriman..." className="input-lux mt-3" />
              </section>
            </Reveal>
          </div>

          <Reveal variant="right">
            <aside className="card-lux h-fit p-6 !rounded-2xl lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-primary">Ringkasan Pesanan</h2>
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
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold text-charcoal">{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Ongkir</span><span className="font-bold text-charcoal">{needDelivery ? formatRupiah(shippingCost) : 'Tanpa pengiriman'}</span></div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-charcoal">Total</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(total)}</span>
              </div>
              <button type="submit" disabled={submitting} className="mt-5 w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                {submitting ? 'Memproses...' : 'Buat Pesanan'}
              </button>
              <Link to="/cart" className="mt-3 block text-center text-sm font-medium text-secondary hover:underline">← Kembali ke keranjang</Link>
            </aside>
          </Reveal>
        </form>
      </div>
    </div>
  );
}
