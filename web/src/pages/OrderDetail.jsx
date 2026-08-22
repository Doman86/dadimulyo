import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchOrder } from '../api/orders';
import { formatNumber, formatRupiah } from '../utils/format';

const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Diproses', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
};

const PAYMENT_STATUS = {
  unpaid: { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-700' },
  paid: { label: 'Lunas', color: 'bg-green-100 text-green-700' },
  refunded: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-600' },
};

const DELIVERY_STATUS = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: 'Truck Ditugaskan', color: 'bg-blue-100 text-blue-700' },
  in_transit: { label: 'Dalam Perjalanan', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Terkirim', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchOrder(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat pesanan...</p>;
  if (notFound || !order)
    return (
      <div className="py-20 text-center">
        <p className="text-gray-600">Pesanan tidak ditemukan.</p>
        <Link to="/orders" className="mt-3 inline-block font-medium text-secondary hover:underline">
          Kembali ke riwayat
        </Link>
      </div>
    );

  const delivery = order.delivery;
  const addr = order.shipping_address;
  const status = ORDER_STATUS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
  const payStatus =
    PAYMENT_STATUS[order.payment_status] || { label: order.payment_status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/orders" className="text-sm font-medium text-secondary hover:underline">
        ← Kembali ke riwayat
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Dibuat{' '}
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`rounded px-3 py-1 text-sm font-semibold ${status.color}`}>{status.label}</span>
          <span className={`rounded px-3 py-1 text-sm font-semibold ${payStatus.color}`}>{payStatus.label}</span>
        </div>
      </div>

      {/* Items */}
      <section className="mt-8 rounded-lg border bg-white">
        <h2 className="border-b px-5 py-3 font-semibold text-gray-900">Item Pesanan</h2>
        <div className="divide-y">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium text-gray-900">{item.product_name || 'Produk'}</div>
                <div className="text-xs text-gray-500">
                  {formatNumber(item.quantity_kg)} kg × {formatRupiah(item.price_per_kg)}
                </div>
              </div>
              <div className="font-semibold">{formatRupiah(item.subtotal)}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ongkir</span>
            <span>{formatRupiah(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatRupiah(order.total)}</span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Address */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold text-gray-900">Alamat Pengiriman</h2>
          {addr ? (
            <div className="mt-3 text-sm text-gray-700">
              <div className="font-medium text-gray-900">
                {addr.recipient_name} {addr.phone && <span className="font-normal text-gray-500">· {addr.phone}</span>}
              </div>
              <p className="mt-1 whitespace-pre-line">
                {addr.address}
                {addr.city && <>, {addr.city}</>}
                {addr.province && <>, {addr.province}</>}
                {addr.postal_code && <> {addr.postal_code}</>}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Tidak ada alamat pengiriman.</p>
          )}
        </section>

        {/* Delivery */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold text-gray-900">Pengiriman</h2>
          {delivery ? (
            <div className="mt-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    (DELIVERY_STATUS[delivery.status] || {}).color || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {(DELIVERY_STATUS[delivery.status] || { label: delivery.status }).label}
                </span>
                {delivery.truck && (
                  <span className="text-gray-600">
                    🚛 {delivery.truck.brand} {delivery.truck.model}
                  </span>
                )}
              </div>
              <dl className="mt-3 space-y-1.5">
                {delivery.driver && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Sopir</dt>
                    <dd className="font-medium">{delivery.driver.name}</dd>
                  </div>
                )}
                {delivery.pickup_address && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-gray-500">Ambil dari</dt>
                    <dd className="text-right">{delivery.pickup_address}</dd>
                  </div>
                )}
                {delivery.destination_address && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-gray-500">Tujuan</dt>
                    <dd className="text-right">{delivery.destination_address}</dd>
                  </div>
                )}
                {delivery.scheduled_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Jadwal</dt>
                    <dd className="font-medium">{delivery.scheduled_at}</dd>
                  </div>
                )}
                {delivery.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Ongkir</dt>
                    <dd className="font-medium">{formatRupiah(delivery.shipping_cost)}</dd>
                  </div>
                )}
                {delivery.notes && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-gray-500">Catatan</dt>
                    <dd className="text-right">{delivery.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Pengiriman belum diatur.</p>
          )}
        </section>
      </div>

      {order.notes && (
        <section className="mt-6 rounded-lg border bg-white p-5">
          <h2 className="font-semibold text-gray-900">Catatan Pesanan</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{order.notes}</p>
        </section>
      )}
    </div>
  );
}
