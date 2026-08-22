import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { fetchTrucks } from '../api/trucks';
import { BULK_THRESHOLD_KG, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';

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
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [user, items.length, navigate]);

  useEffect(() => {
    fetchTrucks({ per_page: 50, status: 'available' })
      .then((result) => setTrucks(result.data))
      .catch(() => {});
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
      items: items.map((item) => ({
        orange_product_id: item.product_id,
        quantity_kg: item.quantity_kg,
      })),
      address,
      notes: notes || undefined,
    };

    if (needDelivery) {
      payload.shipping_cost = shippingCost;
      payload.delivery = {
        truck_id: delivery.truck_id ? Number(delivery.truck_id) : undefined,
        scheduled_at: delivery.scheduled_at || undefined,
        notes: notes || undefined,
      };
    }

    try {
      const order = await createOrder(payload);
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const firstError = err.response?.data?.errors;
      setError(
        firstError
          ? Object.values(firstError)[0]?.[0]
          : err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.'
      );
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-600">Keranjang kosong.</p>
        <Link to="/oranges" className="mt-3 inline-block font-medium text-secondary hover:underline">
          Kembali belanja
        </Link>
      </div>
    );
  }

  const inputCls =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Checkout</h1>
      <p className="mt-1 text-gray-600">Lengkapi alamat pengiriman dan opsi pengiriman.</p>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold text-gray-900">Alamat Pengiriman</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nama Penerima *</label>
                <input
                  required
                  value={address.recipient_name || user?.name || ''}
                  onChange={set('recipient_name')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>No. HP / WA *</label>
                <input
                  required
                  type="tel"
                  value={address.phone || user?.phone || ''}
                  onChange={set('phone')}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Alamat Lengkap *</label>
                <textarea
                  required
                  rows={3}
                  value={address.address}
                  onChange={set('address')}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Kelurahan/Desa</label>
                <input value={address.village} onChange={set('village')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kecamatan</label>
                <input value={address.district} onChange={set('district')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kota/Kabupaten *</label>
                <input required value={address.city} onChange={set('city')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Provinsi</label>
                <input value={address.province} onChange={set('province')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kode Pos</label>
                <input value={address.postal_code} onChange={set('postal_code')} className={inputCls} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold text-gray-900">Pengiriman</h2>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={needDelivery}
                onChange={(e) => setNeedDelivery(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Saya butuh pengiriman menggunakan truck Dadi Mulyo
            </label>

            {needDelivery && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Pilih Truck</label>
                  <select
                    value={delivery.truck_id}
                    onChange={setDeliveryField('truck_id')}
                    className={inputCls}
                  >
                    <option value="">Tanpa truck khusus</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.brand} {truck.model} · {truck.location || '-'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Jadwal Pengiriman</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={delivery.scheduled_at}
                    onChange={setDeliveryField('scheduled_at')}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Estimasi Ongkir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={delivery.shipping_cost}
                    onChange={setDeliveryField('shipping_cost')}
                    placeholder="0"
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Biaya dikonfirmasi oleh admin; pembayaran dilakukan di lokasi/transfer.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold text-gray-900">Catatan (opsional)</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan untuk penjual / pengiriman..."
              className={`${inputCls} mt-2`}
            />
          </section>
        </div>

        {/* Ringkasan */}
        <aside className="h-fit rounded-lg border bg-white p-5 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-primary">Ringkasan Pesanan</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const price = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null
                ? item.wholesale_price
                : item.price_per_kg;
              return (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} <span className="text-gray-400">× {formatNumber(item.quantity_kg)} kg</span>
                  </span>
                  <span className="font-medium">{formatRupiah(price * item.quantity_kg)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatRupiah(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-gray-600">Ongkir</span>
              <span className="font-semibold">
                {needDelivery ? formatRupiah(shippingCost) : 'Tanpa pengiriman'}
              </span>
            </div>
            <div className="mt-3 flex justify-between border-t pt-3">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
          <Link to="/cart" className="mt-3 block text-center text-sm font-medium text-secondary hover:underline">
            ← Kembali ke keranjang
          </Link>
        </aside>
      </form>
    </div>
  );
}
