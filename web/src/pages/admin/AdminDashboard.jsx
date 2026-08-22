import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import { formatNumber, formatRupiah } from '../../utils/format';
import { whatsappUrl } from '../../utils/contact';

function StatCard({ label, value, accent = 'text-primary' }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function LeadStatusBadge({ status }) {
  const map = {
    new: { label: 'Baru', color: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'Dihubungi', color: 'bg-yellow-100 text-yellow-700' },
    negotiating: { label: 'Negosiasi', color: 'bg-purple-100 text-purple-700' },
    won: { label: 'Menang', color: 'bg-green-100 text-green-700' },
    lost: { label: 'Gagal', color: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function ContactActions({ phone, name, message }) {
  if (!phone) {
    return <span className="text-xs text-red-600">Nomor customer belum tersedia</span>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <a
        href={whatsappUrl(phone, `Halo ${name || 'Bapak/Ibu'}, kami dari Dadi Mulyo. ${message}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        title="Hubungi customer melalui WhatsApp"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${phone}`}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        title="Telepon customer"
      >
        Telepon
      </a>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const role = user?.role?.name;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchDashboard()
      .then(setStats)
      .catch(() => setError('Gagal memuat dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 15000);

    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat dashboard...</p>;

  const summary = stats?.summary || {};

  if (role === 'sales') {
    const leads = summary;
    const recentLeads = stats?.recent_leads || [];
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard Sales</h1>
        <p className="text-sm text-gray-600">Pantau leads dan follow-up Anda.</p>

        {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Leads" value={leads.leads_total ?? 0} />
          <StatCard label="Baru" value={leads.leads_new ?? 0} accent="text-blue-600" />
          <StatCard label="Dihubungi" value={leads.leads_contacted ?? 0} accent="text-yellow-600" />
          <StatCard label="Negosiasi" value={leads.leads_negotiating ?? 0} accent="text-purple-600" />
          <StatCard label="Menang" value={leads.leads_won ?? 0} accent="text-green-600" />
          <StatCard label="Gagal" value={leads.leads_lost ?? 0} accent="text-red-600" />
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Leads Terbaru</h2>
            <Link to="/admin/leads" className="text-sm font-medium text-secondary hover:underline">
              Kelola semua →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Belum ada lead.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {lead.name} <span className="font-normal text-gray-500">· {lead.phone}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.truck
                          ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}`
                          : 'Inquiry umum'}
                        {lead.source ? ` · Sumber: ${lead.source}` : ''}
                      </div>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (role === 'truck_seller') {
    const recentTrucks = stats?.recent_trucks || [];
    const recentLeads = stats?.recent_leads || [];
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard Truck Seller</h1>
        <p className="text-sm text-gray-600">Kelola listing truck dan inquiry Anda.</p>

        {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Truck" value={summary.trucks_total ?? 0} />
          <StatCard label="Tersedia" value={summary.trucks_available ?? 0} accent="text-green-600" />
          <StatCard label="Leads" value={summary.leads_total ?? 0} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Truck Terbaru</h2>
              <Link to="/admin/trucks" className="text-sm font-medium text-secondary hover:underline">
                Kelola →
              </Link>
            </div>
            {recentTrucks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Belum ada truck.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {recentTrucks.map((truck) => (
                  <div key={truck.id} className="rounded-lg border bg-white p-4">
                    <div className="font-semibold text-gray-900">
                      {truck.brand} {truck.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatRupiah(truck.price)} · {truck.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Inquiry Terbaru</h2>
              <Link to="/admin/leads" className="text-sm font-medium text-secondary hover:underline">
                Kelola →
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Belum ada inquiry.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-lg border bg-white p-4">
                    <div className="font-semibold text-gray-900">
                      {lead.name} <span className="font-normal text-gray-500">· {lead.phone}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {lead.truck ? `${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}
                      </span>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (role === 'orange_seller') {
    const recentProducts = stats?.recent_products || [];
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard Orange Seller</h1>
        <p className="text-sm text-gray-600">Pantau produk jeruk dan stok Anda.</p>

        {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Produk" value={summary.oranges_total ?? 0} />
          <StatCard label="Total Stok (kg)" value={formatNumber(summary.stock_total_kg ?? 0)} />
          <StatCard label="Total Pesanan" value={summary.orders_total ?? 0} />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-primary">Produk Terbaru</h2>
          {recentProducts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Belum ada produk.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {recentProducts.map((product) => (
                <div key={product.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {product.name}{' '}
                      <span className="font-normal text-gray-500">· Grade {product.grade}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-primary">
                        {formatRupiah(product.price_per_kg)}
                        <span className="font-normal text-gray-500"> / kg</span>
                      </div>
                      <div className="text-gray-500">Stok {formatNumber(product.stock_kg)} kg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Admin
  const recentOrders = stats?.recent_orders || [];
  const recentLeads = stats?.recent_leads || [];
  const recentRentals = stats?.recent_rentals || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Dashboard Admin</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Ringkasan bisnis Dadi Mulyo.</p>
        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Truck" value={summary.trucks_total ?? 0} />
        <StatCard label="Rental" value={summary.rentals_total ?? 0} />
        <StatCard label="Pesanan" value={summary.orders_total ?? 0} />
        <StatCard label="Leads" value={summary.leads_total ?? 0} />
        <StatCard label="Pengguna" value={summary.users_total ?? 0} />
        <StatCard label="Produk Jeruk" value={summary.oranges_total ?? 0} />
        <StatCard
          label="Pendapatan (Lunas)"
          value={formatRupiah(summary.revenue ?? 0)}
          accent="text-green-600"
        />
        <StatCard label="Pesanan Pending" value={summary.orders_pending ?? 0} accent="text-yellow-600" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold text-primary">Pesanan Terbaru</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Belum ada pesanan.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-500">
                        {order.customer?.name} ·{' '}
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <ContactActions
                        phone={order.customer?.phone || order.shipping_address?.phone}
                        name={order.customer?.name || order.shipping_address?.recipient_name}
                        message={`terkait pesanan ${order.order_number}.`}
                      />
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatRupiah(order.total)}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{order.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Leads Terbaru</h2>
            <Link to="/admin/leads" className="text-sm font-medium text-secondary hover:underline">
              Kelola →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Belum ada lead.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {lead.name} <span className="font-normal text-gray-500">· {lead.phone}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.truck
                          ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}`
                          : 'Inquiry umum'}
                      </div>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-primary">Rental Terbaru</h2>
        {recentRentals.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Belum ada rental.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {recentRentals.map((rental) => (
              <div key={rental.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rental.truck?.brand} {rental.truck?.model}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rental.customer?.name} · {rental.start_date} → {rental.end_date}
                    </div>
                    <ContactActions
                      phone={rental.customer?.phone}
                      name={rental.customer?.name}
                      message={`terkait booking rental truck ID ${rental.id}.`}
                    />
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatRupiah(rental.total_price)}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{rental.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
