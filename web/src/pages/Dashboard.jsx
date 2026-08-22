import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/format';

const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Diproses', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
};

const RENTAL_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
};

function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
  );
}

function SummaryCard({ icon, label, value, to }) {
  return (
    <Link to={to} className="rounded-lg border bg-white p-6 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Staff (admin/sales/truck_seller/orange_seller) menggunakan panel admin.
  if (['admin', 'sales', 'truck_seller', 'orange_seller'].includes(user?.role?.name)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch(() => setError('Gagal memuat dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat dashboard...</p>;

  const summary = stats?.summary || {};
  const orders = stats?.recent_orders || [];
  const rentals = stats?.recent_rentals || [];
  const wishlists = stats?.recent_wishlists || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-primary">Halo, {user?.name} 👋</h1>
      <p className="mt-2 text-gray-600">Ringkasan aktivitas Anda di Dadi Mulyo.</p>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Summary cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon="🍊"
          label="Pesanan"
          value={summary.orders_total ?? 0}
          to="/orders"
        />
        <SummaryCard
          icon="🚚"
          label="Sewa Truck"
          value={summary.rentals_total ?? 0}
          to="/rental"
        />
        <SummaryCard
          icon="♥"
          label="Wishlist"
          value={summary.wishlist_total ?? 0}
          to="/trucks"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Recent orders */}
        <section>
          <h2 className="text-xl font-bold text-primary">Pesanan Terbaru</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Belum ada pesanan.{' '}
              <Link to="/oranges" className="font-medium text-secondary hover:underline">
                Beli jeruk sekarang
              </Link>
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        · {order.items?.length ?? 0} item
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatRupiah(order.total)}</div>
                      <div className="mt-1">
                        <StatusBadge map={ORDER_STATUS} value={order.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent rentals */}
        <section>
          <h2 className="text-xl font-bold text-primary">Sewa Truck Terbaru</h2>
          {rentals.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Belum ada sewa.{' '}
              <Link to="/rental" className="font-medium text-secondary hover:underline">
                Sewa truck sekarang
              </Link>
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {rentals.map((rental) => (
                <div key={rental.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {rental.truck?.brand} {rental.truck?.model}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rental.start_date} → {rental.end_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatRupiah(rental.total_price)}</div>
                      <div className="mt-1">
                        <StatusBadge map={RENTAL_STATUS} value={rental.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Wishlist preview */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-primary">Wishlist Truck</h2>
        {wishlists.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Belum ada truck tersimpan.{' '}
            <Link to="/trucks" className="font-medium text-secondary hover:underline">
              Jelajahi katalog
            </Link>
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((truck) => (
              <Link
                key={truck.id}
                to={`/trucks/${truck.id}`}
                className="overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-video w-full bg-gray-200">
                  {truck.images?.[0]?.image_url ? (
                    <img
                      src={truck.images[0].image_url}
                      alt={`${truck.brand} ${truck.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🚛</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500">{truck.year}</div>
                  <div className="mt-0.5 font-semibold text-gray-900">
                    {truck.brand} {truck.model}
                  </div>
                  <div className="mt-1 font-bold text-primary">{formatRupiah(truck.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
