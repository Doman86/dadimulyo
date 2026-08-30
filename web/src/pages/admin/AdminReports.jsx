import { useEffect, useState } from 'react';
import { fetchReports } from '../../api/reports';
import { formatNumber, formatRupiah } from '../../utils/format';
import Reveal from '../../components/Reveal';
import siteConfig from '../../config/site';

function ReportCard({ label, value, sub, accent = 'text-primary', delay = 0 }) {
  return (
    <Reveal variant="up" delay={delay}>
      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:border-gold/30 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-2 text-2xl font-extrabold ${accent}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </Reveal>
  );
}

function Section({ title, children, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="mb-4 font-display font-bold text-charcoal">{title}</h3>
        {children}
      </div>
    </Reveal>
  );
}

function DataTable({ headers, rows, emptyMessage = 'Belum ada data' }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-gray-400 py-4">{emptyMessage}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-50 text-left text-gray-400">
            {headers.map((h) => <th key={h} className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className="py-2 pr-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    processing: { label: 'Diproses', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    completed: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border border-red-100' },
    available: { label: 'Tersedia', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    sold: { label: 'Terjual', color: 'bg-gray-50 text-gray-600 border border-gray-100' },
    rented: { label: 'Disewa', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    new: { label: 'Baru', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    contacted: { label: 'Dihubungi', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    negotiating: { label: 'Negosiasi', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    won: { label: 'Menang', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    lost: { label: 'Gagal', color: 'bg-red-50 text-red-600 border border-red-100' },
    active: { label: 'Aktif', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    unpaid: { label: 'Belum Bayar', color: 'bg-orange-50 text-orange-600 border border-orange-100' },
    paid: { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    refunded: { label: 'Dikembalikan', color: 'bg-gray-50 text-gray-600 border border-gray-100' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-50 text-gray-600 border border-gray-100' };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    fetchReports({ period }).then(setReports).catch(() => setError('Gagal memuat data laporan.')).finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="mt-4 text-sm text-gray-400">Memuat laporan...</p>
    </div>
  );

  if (error) return (
    <Reveal>
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <p className="text-red-500 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-secondary hover:underline">Coba lagi</button>
      </div>
    </Reveal>
  );

  const { revenue, orders, trucks, oranges, leads, rentals, users } = reports || {};

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Laporan</h1>
            <p className="mt-1 text-sm text-gray-400">Ringkasan data bisnis {siteConfig.company.name}.</p>
          </div>
          <div className="flex gap-2">
            {[{ value: 'week', label: 'Minggu Ini' }, { value: 'month', label: 'Bulan Ini' }, { value: 'year', label: 'Tahun Ini' }].map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${period === p.value ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>{p.label}</button>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard label="Total Pendapatan" value={formatRupiah(revenue?.total ?? 0)} accent="text-emerald-600" delay={0} />
        <ReportCard label="Total Pesanan" value={orders?.total ?? 0} delay={50} />
        <ReportCard label="Total Truck" value={trucks?.total ?? 0} delay={100} />
        <ReportCard label="Total Produk Jeruk" value={oranges?.total ?? 0} delay={150} />
        <ReportCard label="Total Leads" value={leads?.total ?? 0} delay={200} />
        <ReportCard label="Konversi Leads" value={`${leads?.conversion_rate ?? 0}%`} accent="text-blue-600" delay={250} />
        <ReportCard label="Total Rental" value={rentals?.total ?? 0} delay={300} />
        <ReportCard label="Total Pengguna" value={users?.total ?? 0} delay={350} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Pendapatan per Bulan" delay={100}>
          <DataTable headers={['Bulan', 'Pendapatan', 'Jumlah Pesanan']} rows={(revenue?.monthly ?? []).map((r) => [r.month, formatRupiah(r.revenue), r.order_count])} emptyMessage="Belum ada data pendapatan" />
        </Section>
        <Section title="Pesanan per Status" delay={150}>
          <DataTable headers={['Status', 'Jumlah']} rows={(orders?.by_status ?? []).map((r) => [<StatusBadge key={r.status} status={r.status} />, r.count])} emptyMessage="Belum ada pesanan" />
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm text-gray-400">Rata-rata nilai pesanan: <span className="font-bold text-primary">{formatRupiah(orders?.avg_value ?? 0)}</span></div>
        </Section>
        <Section title="Pesanan per Status Pembayaran" delay={200}>
          <DataTable headers={['Status Pembayaran', 'Jumlah']} rows={(orders?.by_payment_status ?? []).map((r) => [<StatusBadge key={r.payment_status} status={r.payment_status} />, r.count])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Truck per Kategori" delay={250}>
          <DataTable headers={['Kategori', 'Jumlah']} rows={(trucks?.by_category ?? []).map((r) => [r.category, r.count])} emptyMessage="Belum ada data" />
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm text-gray-400">Total nilai aset truck: <span className="font-bold text-primary">{formatRupiah(trucks?.total_value ?? 0)}</span></div>
        </Section>
        <Section title="Truck per Status" delay={300}>
          <DataTable headers={['Status', 'Jumlah']} rows={(trucks?.by_status ?? []).map((r) => [<StatusBadge key={r.status} status={r.status} />, r.count])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Truck per Kondisi" delay={350}>
          <DataTable headers={['Kondisi', 'Jumlah']} rows={(trucks?.by_condition ?? []).map((r) => [r.condition ? r.condition.charAt(0).toUpperCase() + r.condition.slice(1) : '-', r.count])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Produk Jeruk per Grade" delay={400}>
          <DataTable headers={['Grade', 'Jumlah Produk', 'Total Stok (kg)']} rows={(oranges?.by_grade ?? []).map((r) => [r.grade ? <span key={r.grade} className="inline-flex items-center rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">Grade {r.grade}</span> : '-', r.count, formatNumber(r.stock_kg)])} emptyMessage="Belum ada data" />
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm text-gray-400">Total stok: <span className="font-bold">{formatNumber(oranges?.total_stock_kg ?? 0)} kg</span> · Stok habis: <span className="font-bold text-red-500">{oranges?.out_of_stock ?? 0} produk</span></div>
        </Section>
        <Section title="Produk Jeruk per Kategori" delay={450}>
          <DataTable headers={['Kategori', 'Jumlah', 'Total Stok (kg)']} rows={(oranges?.by_category ?? []).map((r) => [r.category, r.count, formatNumber(r.stock_kg)])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Leads per Status" delay={500}>
          <DataTable headers={['Status', 'Jumlah']} rows={(leads?.by_status ?? []).map((r) => [<StatusBadge key={r.status} status={r.status} />, r.count])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Leads per Sumber" delay={550}>
          <DataTable headers={['Sumber', 'Jumlah']} rows={(leads?.by_source ?? []).map((r) => [r.source || 'Tidak diketahui', r.count])} emptyMessage="Belum ada data" />
        </Section>
        <Section title="Rental per Status" delay={600}>
          <DataTable headers={['Status', 'Jumlah', 'Pendapatan']} rows={(rentals?.by_status ?? []).map((r) => [<StatusBadge key={r.status} status={r.status} />, r.count, formatRupiah(r.revenue ?? 0)])} emptyMessage="Belum ada data" />
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm text-gray-400">Total pendapatan rental: <span className="font-bold text-primary">{formatRupiah(rentals?.total_revenue ?? 0)}</span></div>
        </Section>
        <Section title="Pengguna per Role" delay={650}>
          <DataTable headers={['Role', 'Jumlah']} rows={(users?.by_role ?? []).map((r) => [r.role ? r.role.charAt(0).toUpperCase() + r.role.slice(1).replace('_', ' ') : '-', r.count])} emptyMessage="Belum ada data" />
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm text-gray-400">Pengguna baru bulan ini: <span className="font-bold text-secondary">{users?.new_this_month ?? 0}</span></div>
        </Section>
      </div>
    </div>
  );
}
