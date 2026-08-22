import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/orders';
import { formatRupiah } from '../utils/format';

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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders({ per_page: 20 })
      .then((result) => {
        setOrders(result.data);
        setMeta(result.meta || {});
      })
      .catch(() => setError('Gagal memuat riwayat pesanan.'))
      .finally(() => setLoading(false));
  }, []);

  function badge(map, value) {
    const s = map[value] || { label: value, color: 'bg-gray-100 text-gray-700' };
    return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Riwayat Pesanan</h1>
      <p className="mt-1 text-gray-600">Semua pesanan jeruk Anda.</p>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-10 text-center text-gray-500">Memuat data...</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-gray-600">Belum ada pesanan.</p>
          <Link to="/oranges" className="mt-3 inline-block font-medium text-secondary hover:underline">
            Belanja jeruk sekarang
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-lg border bg-white p-5 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{order.order_number}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {order.items?.length ?? 0} item
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{formatRupiah(order.total)}</div>
                  <div className="mt-1 flex justify-end gap-1">
                    {badge(ORDER_STATUS, order.status)}
                    {badge(PAYMENT_STATUS, order.payment_status)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Halaman {meta.current_page} dari {meta.last_page}
        </p>
      )}
    </div>
  );
}
