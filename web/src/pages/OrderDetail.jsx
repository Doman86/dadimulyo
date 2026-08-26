import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchOrder } from '../api/orders';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';

const ORDER_STATUS = {
  pending: { label: 'Pending', cls: 'badge-orange' },
  confirmed: { label: 'Dikonfirmasi', cls: 'badge-green' },
  processing: { label: 'Diproses', cls: 'badge-gold' },
  completed: { label: 'Selesai', cls: 'badge-green' },
  cancelled: { label: 'Dibatalkan', cls: 'badge-orange' },
};
const PAYMENT_STATUS = {
  unpaid: { label: 'Belum Bayar', cls: 'badge-orange' },
  paid: { label: 'Lunas', cls: 'badge-green' },
  refunded: { label: 'Dikembalikan', cls: 'badge-gold' },
};
const DELIVERY_STATUS = {
  pending: { label: 'Menunggu', cls: 'badge-orange' },
  assigned: { label: 'Truck Ditugaskan', cls: 'badge-green' },
  in_transit: { label: 'Dalam Perjalanan', cls: 'badge-gold' },
  delivered: { label: 'Terkirim', cls: 'badge-green' },
  cancelled: { label: 'Dibatalkan', cls: 'badge-orange' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false);
    fetchOrder(id).then((d) => { if (!cancelled) setOrder(d); }).catch(() => { if (!cancelled) setNotFound(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="py-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" /><p className="mt-4 text-gray-500">Memuat pesanan...</p></div>;
  if (notFound || !order) return <div className="py-20 text-center"><p className="text-gray-500">Pesanan tidak ditemukan.</p><Link to="/orders" className="mt-3 inline-flex btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">Kembali ke riwayat</Link></div>;

  const delivery = order.delivery;
  const addr = order.shipping_address;

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link to="/orders" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali ke riwayat
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-charcoal">{order.order_number}</h1>
              <p className="mt-1 text-sm text-gray-400">
                Dibuat {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={(ORDER_STATUS[order.status] || {}).cls || 'badge-gold'}>{(ORDER_STATUS[order.status] || { label: order.status }).label}</span>
              <span className={(PAYMENT_STATUS[order.payment_status] || {}).cls || 'badge-gold'}>{(PAYMENT_STATUS[order.payment_status] || { label: order.payment_status }).label}</span>
            </div>
          </div>
        </Reveal>

        <Reveal variant="up" delay={100}>
          <section className="mt-8 card-lux !rounded-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3"><h2 className="font-display font-bold text-charcoal">Item Pesanan</h2></div>
            <div className="divide-y divide-gray-50">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-bold text-charcoal">{item.product_name || 'Produk'}</div>
                    <div className="text-xs text-gray-400">{formatNumber(item.quantity_kg)} kg × {formatRupiah(item.price_per_kg)}</div>
                  </div>
                  <div className="font-bold text-primary">{formatRupiah(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold text-charcoal">{formatRupiah(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ongkir</span><span className="font-bold text-charcoal">{formatRupiah(order.shipping_cost)}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-charcoal">Total</span><span className="text-lg font-extrabold text-primary">{formatRupiah(order.total)}</span></div>
            </div>
          </section>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal variant="left">
            <section className="card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">Alamat Pengiriman</h2>
              {addr ? (
                <div className="mt-3 text-sm">
                  <div className="font-bold text-charcoal">{addr.recipient_name} {addr.phone && <span className="font-normal text-gray-400">· {addr.phone}</span>}</div>
                  <p className="mt-1 text-gray-500 whitespace-pre-line">{addr.address}{addr.city && <>, {addr.city}</>}{addr.province && <>, {addr.province}</>}{addr.postal_code && <> {addr.postal_code}</>}</p>
                </div>
              ) : <p className="mt-3 text-sm text-gray-400">Tidak ada alamat pengiriman.</p>}
            </section>
          </Reveal>
          <Reveal variant="right">
            <section className="card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">Pengiriman</h2>
              {delivery ? (
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={(DELIVERY_STATUS[delivery.status] || {}).cls || 'badge-gold'}>{(DELIVERY_STATUS[delivery.status] || { label: delivery.status }).label}</span>
                    {delivery.truck && <span className="text-gray-500">🚛 {delivery.truck.brand} {delivery.truck.model}</span>}
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    {delivery.driver && <div className="flex justify-between"><dt className="text-gray-400">Sopir</dt><dd className="font-bold text-charcoal">{delivery.driver.name}</dd></div>}
                    {delivery.pickup_address && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">Ambil dari</dt><dd className="text-right text-charcoal">{delivery.pickup_address}</dd></div>}
                    {delivery.destination_address && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">Tujuan</dt><dd className="text-right text-charcoal">{delivery.destination_address}</dd></div>}
                    {delivery.scheduled_at && <div className="flex justify-between"><dt className="text-gray-400">Jadwal</dt><dd className="font-bold text-charcoal">{delivery.scheduled_at}</dd></div>}
                    {delivery.shipping_cost > 0 && <div className="flex justify-between"><dt className="text-gray-400">Ongkir</dt><dd className="font-bold text-charcoal">{formatRupiah(delivery.shipping_cost)}</dd></div>}
                    {delivery.notes && <div className="flex justify-between gap-4"><dt className="shrink-0 text-gray-400">Catatan</dt><dd className="text-right text-charcoal">{delivery.notes}</dd></div>}
                  </dl>
                </div>
              ) : <p className="mt-3 text-sm text-gray-400">Pengiriman belum diatur.</p>}
            </section>
          </Reveal>
        </div>

        {order.notes && (
          <Reveal>
            <section className="mt-6 card-lux p-5 !rounded-2xl">
              <h2 className="font-display font-bold text-charcoal">Catatan Pesanan</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-500">{order.notes}</p>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
