import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import { formatNumber, formatRupiah } from '../../utils/format';
import { whatsappUrl } from '../../utils/contact';
import Reveal from '../../components/Reveal';
import siteConfig from '../../config/site';

function StatCard({ label, value, accent = 'text-primary', icon, delay = 0 }) {
  return (
    <Reveal variant="up" delay={delay}>
      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:border-gold/30 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
              <p className={`mt-2 text-2xl font-extrabold ${accent}`}>{value}</p>
            </div>
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-gold/10 group-hover:text-gold">
                {icon}
              </div>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function LeadStatusBadge({ status }) {
  const map = {
    new: { label: 'Baru', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    contacted: { label: 'Dihubungi', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    negotiating: { label: 'Negosiasi', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    won: { label: 'Menang', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    lost: { label: 'Gagal', color: 'bg-red-50 text-red-600 border border-red-100' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-50 text-gray-600 border border-gray-100' };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function ContactActions({ phone, name, message }) {
  if (!phone) return <span className="text-xs text-red-400 italic">Nomor belum tersedia</span>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <a href={whatsappUrl(phone, `Halo ${name || 'Bapak/Ibu'}, kami dari {siteConfig.company.name}. ${message}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        WhatsApp
      </a>
      <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
        Telepon
      </a>
    </div>
  );
}

function SectionCard({ title, action, children, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {title && (
          <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-charcoal">{title}</h2>
            {action}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </Reveal>
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
    const refreshTimer = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="mt-4 text-sm text-gray-400">Memuat dashboard...</p>
    </div>
  );

  const summary = stats?.summary || {};

  // Sales view
  if (role === 'sales') {
    const leads = summary;
    const recentLeads = stats?.recent_leads || [];
    return (
      <div className="space-y-6">
        <Reveal><div><h1 className="font-display text-3xl font-extrabold text-charcoal">Dashboard Sales</h1><p className="mt-1 text-sm text-gray-400">Pantau leads dan follow-up Anda.</p></div></Reveal>
        {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Leads" value={leads.leads_total ?? 0} />
          <StatCard label="Baru" value={leads.leads_new ?? 0} accent="text-blue-600" delay={50} />
          <StatCard label="Dihubungi" value={leads.leads_contacted ?? 0} accent="text-amber-600" delay={100} />
          <StatCard label="Negosiasi" value={leads.leads_negotiating ?? 0} accent="text-purple-600" delay={150} />
          <StatCard label="Menang" value={leads.leads_won ?? 0} accent="text-emerald-600" delay={200} />
          <StatCard label="Gagal" value={leads.leads_lost ?? 0} accent="text-red-600" delay={250} />
        </div>
        <SectionCard title="Leads Terbaru" action={<Link to="/admin/leads" className="text-sm font-semibold text-secondary hover:underline">Kelola semua →</Link>}>
          {recentLeads.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Belum ada lead.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">{lead.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <p className="font-semibold text-charcoal">{lead.name} <span className="font-normal text-gray-400">· {lead.phone}</span></p>
                      <p className="text-xs text-gray-400">{lead.truck ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}{lead.source ? ` · ${lead.source}` : ''}</p>
                    </div>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  // Truck seller view
  if (role === 'truck_seller') {
    const recentTrucks = stats?.recent_trucks || [];
    const recentLeads = stats?.recent_leads || [];
    return (
      <div className="space-y-6">
        <Reveal><div><h1 className="font-display text-3xl font-extrabold text-charcoal">Dashboard Truck Seller</h1><p className="mt-1 text-sm text-gray-400">Kelola listing truck dan inquiry Anda.</p></div></Reveal>
        {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Truck" value={summary.trucks_total ?? 0} />
          <StatCard label="Tersedia" value={summary.trucks_available ?? 0} accent="text-emerald-600" delay={50} />
          <StatCard label="Leads" value={summary.leads_total ?? 0} delay={100} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Truck Terbaru" action={<Link to="/admin/trucks" className="text-sm font-semibold text-secondary hover:underline">Kelola →</Link>}>
            {recentTrucks.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada truck.</p> : (
              <div className="divide-y divide-gray-50">{recentTrucks.map((truck) => (<div key={truck.id} className="py-3"><p className="font-semibold text-charcoal">{truck.brand} {truck.model}</p><p className="text-sm text-gray-400">{formatRupiah(truck.price)} · {truck.status}</p></div>))}</div>
            )}
          </SectionCard>
          <SectionCard title="Inquiry Terbaru" action={<Link to="/admin/leads" className="text-sm font-semibold text-secondary hover:underline">Kelola →</Link>}>
            {recentLeads.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada inquiry.</p> : (
              <div className="divide-y divide-gray-50">{recentLeads.map((lead) => (<div key={lead.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold text-charcoal">{lead.name} <span className="font-normal text-gray-400">· {lead.phone}</span></p><p className="text-xs text-gray-400">{lead.truck ? `${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}</p></div><LeadStatusBadge status={lead.status} /></div>))}</div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  // Orange seller view
  if (role === 'orange_seller') {
    const recentProducts = stats?.recent_products || [];
    return (
      <div className="space-y-6">
        <Reveal><div><h1 className="font-display text-3xl font-extrabold text-charcoal">Dashboard Orange Seller</h1><p className="mt-1 text-sm text-gray-400">Pantau produk jeruk dan stok Anda.</p></div></Reveal>
        {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Produk" value={summary.oranges_total ?? 0} />
          <StatCard label="Total Stok (kg)" value={formatNumber(summary.stock_total_kg ?? 0)} delay={50} />
          <StatCard label="Total Pesanan" value={summary.orders_total ?? 0} delay={100} />
        </div>
        <SectionCard title="Produk Terbaru">
          {recentProducts.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada produk.</p> : (
            <div className="divide-y divide-gray-50">{recentProducts.map((product) => (<div key={product.id} className="flex items-center justify-between py-3"><div><p className="font-semibold text-charcoal">{product.name} <span className="font-normal text-gray-400">· Grade {product.grade}</span></p><p className="text-sm text-gray-400">Stok {formatNumber(product.stock_kg)} kg</p></div><p className="text-sm font-bold text-primary">{formatRupiah(product.price_per_kg)}<span className="font-normal text-gray-400">/kg</span></p></div>))}</div>
          )}
        </SectionCard>
      </div>
    );
  }

  // Admin view
  const recentOrders = stats?.recent_orders || [];
  const recentLeads = stats?.recent_leads || [];
  const recentRentals = stats?.recent_rentals || [];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-gray-400">Ringkasan bisnis {siteConfig.company.name}.</p>
          </div>
          <button type="button" onClick={loadDashboard} disabled={loading} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </Reveal>
      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Truck" value={summary.trucks_total ?? 0} delay={0} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>} />
        <StatCard label="Rental" value={summary.rentals_total ?? 0} delay={50} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} />
        <StatCard label="Pesanan" value={summary.orders_total ?? 0} delay={100} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>} />
        <StatCard label="Leads" value={summary.leads_total ?? 0} delay={150} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>} />
        <StatCard label="Pengguna" value={summary.users_total ?? 0} delay={200} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
        <StatCard label="Produk Jeruk" value={summary.oranges_total ?? 0} delay={250} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>} />
        <StatCard label="Pendapatan" value={formatRupiah(summary.revenue ?? 0)} accent="text-emerald-600" delay={300} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Pesanan Pending" value={summary.orders_pending ?? 0} accent="text-amber-600" delay={350} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Pesanan Terbaru" delay={100}>
          {recentOrders.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada pesanan.</p> : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-charcoal text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.customer?.name} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <ContactActions phone={order.customer?.phone || order.shipping_address?.phone} name={order.customer?.name || order.shipping_address?.recipient_name} message={`terkait pesanan ${order.order_number}.`} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-primary text-sm">{formatRupiah(order.total)}</p>
                    <p className="text-xs text-gray-400">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Leads Terbaru" action={<Link to="/admin/leads" className="text-sm font-semibold text-secondary hover:underline">Kelola →</Link>} delay={150}>
          {recentLeads.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada lead.</p> : (
            <div className="divide-y divide-gray-50">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-charcoal text-sm">{lead.name} <span className="font-normal text-gray-400">· {lead.phone}</span></p>
                    <p className="text-xs text-gray-400">{lead.truck ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}</p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Rental Terbaru" delay={200}>
        {recentRentals.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada rental.</p> : (
          <div className="divide-y divide-gray-50">
            {recentRentals.map((rental) => (
              <div key={rental.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-charcoal text-sm">{rental.truck?.brand} {rental.truck?.model}</p>
                  <p className="text-xs text-gray-400">{rental.customer?.name} · {rental.start_date} → {rental.end_date}</p>
                  <ContactActions phone={rental.customer?.phone} name={rental.customer?.name} message={`terkait booking rental truck ID ${rental.id}.`} />
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-primary text-sm">{formatRupiah(rental.total_price)}</p>
                  <p className="text-xs text-gray-400">{rental.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
