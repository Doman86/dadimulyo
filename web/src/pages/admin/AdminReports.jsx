import { useEffect, useState } from 'react';
import { fetchReports } from '../../api/reports';
import { formatNumber, formatRupiah } from '../../utils/format';

function ReportCard({ label, value, sub, accent = 'text-primary' }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-lg border bg-white p-5">
      <h3 className="mb-4 font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function DataTable({ headers, rows, emptyMessage = 'Belum ada data' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Diproses', color: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
    available: { label: 'Tersedia', color: 'bg-green-100 text-green-700' },
    sold: { label: 'Terjual', color: 'bg-gray-100 text-gray-700' },
    rented: { label: 'Disewa', color: 'bg-blue-100 text-blue-700' },
    new: { label: 'Baru', color: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'Dihubungi', color: 'bg-yellow-100 text-yellow-700' },
    negotiating: { label: 'Negosiasi', color: 'bg-purple-100 text-purple-700' },
    won: { label: 'Menang', color: 'bg-green-100 text-green-700' },
    lost: { label: 'Gagal', color: 'bg-red-100 text-red-700' },
    active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
    unpaid: { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-700' },
    paid: { label: 'Lunas', color: 'bg-green-100 text-green-700' },
    refunded: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    fetchReports({ period })
      .then(setReports)
      .catch(() => setError('Gagal memuat data laporan.'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <p className="py-20 text-center text-gray-500">Memuat laporan...</p>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm text-secondary hover:underline">
          Coba lagi
        </button>
      </div>
    );
  }

  const { revenue, orders, trucks, oranges, leads, rentals, users } = reports || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Laporan</h1>
          <p className="text-sm text-gray-600">Ringkasan data bisnis Dadi Mulyo.</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'week', label: 'Minggu Ini' },
            { value: 'month', label: 'Bulan Ini' },
            { value: 'year', label: 'Tahun Ini' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                period === p.value ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard label="Total Pendapatan" value={formatRupiah(revenue?.total ?? 0)} accent="text-green-600" />
        <ReportCard label="Total Pesanan" value={orders?.total ?? 0} />
        <ReportCard label="Total Truck" value={trucks?.total ?? 0} />
        <ReportCard label="Total Produk Jeruk" value={oranges?.total ?? 0} />
        <ReportCard label="Total Leads" value={leads?.total ?? 0} />
        <ReportCard label="Konversi Leads" value={`${leads?.conversion_rate ?? 0}%`} accent="text-blue-600" />
        <ReportCard label="Total Rental" value={rentals?.total ?? 0} />
        <ReportCard label="Total Pengguna" value={users?.total ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue by Month */}
        <Section title="Pendapatan per Bulan">
          <DataTable
            headers={['Bulan', 'Pendapatan', 'Jumlah Pesanan']}
            rows={(revenue?.monthly ?? []).map((r) => [
              r.month,
              formatRupiah(r.revenue),
              r.order_count,
            ])}
            emptyMessage="Belum ada data pendapatan"
          />
        </Section>

        {/* Orders by Status */}
        <Section title="Pesanan per Status">
          <DataTable
            headers={['Status', 'Jumlah']}
            rows={(orders?.by_status ?? []).map((r) => [
              <StatusBadge status={r.status} />,
              r.count,
            ])}
            emptyMessage="Belum ada pesanan"
          />
          <div className="mt-3 border-t pt-3 text-sm text-gray-500">
            Rata-rata nilai pesanan: <span className="font-semibold text-primary">{formatRupiah(orders?.avg_value ?? 0)}</span>
          </div>
        </Section>

        {/* Orders by Payment */}
        <Section title="Pesanan per Status Pembayaran">
          <DataTable
            headers={['Status Pembayaran', 'Jumlah']}
            rows={(orders?.by_payment_status ?? []).map((r) => [
              <StatusBadge status={r.payment_status} />,
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Trucks by Category */}
        <Section title="Truck per Kategori">
          <DataTable
            headers={['Kategori', 'Jumlah']}
            rows={(trucks?.by_category ?? []).map((r) => [
              r.category,
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
          <div className="mt-3 border-t pt-3 text-sm text-gray-500">
            Total nilai aset truck: <span className="font-semibold text-primary">{formatRupiah(trucks?.total_value ?? 0)}</span>
          </div>
        </Section>

        {/* Trucks by Status */}
        <Section title="Truck per Status">
          <DataTable
            headers={['Status', 'Jumlah']}
            rows={(trucks?.by_status ?? []).map((r) => [
              <StatusBadge status={r.status} />,
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Trucks by Condition */}
        <Section title="Truck per Kondisi">
          <DataTable
            headers={['Kondisi', 'Jumlah']}
            rows={(trucks?.by_condition ?? []).map((r) => [
              r.condition ? r.condition.charAt(0).toUpperCase() + r.condition.slice(1) : '-',
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Oranges by Grade */}
        <Section title="Produk Jeruk per Grade">
          <DataTable
            headers={['Grade', 'Jumlah Produk', 'Total Stok (kg)']}
            rows={(oranges?.by_grade ?? []).map((r) => [
              r.grade ? (
                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-white">
                  Grade {r.grade}
                </span>
              ) : '-',
              r.count,
              formatNumber(r.stock_kg),
            ])}
            emptyMessage="Belum ada data"
          />
          <div className="mt-3 border-t pt-3 text-sm text-gray-500">
            Total stok: <span className="font-semibold">{formatNumber(oranges?.total_stock_kg ?? 0)} kg</span>
            {' · '}
            Stok habis: <span className="font-semibold text-red-600">{oranges?.out_of_stock ?? 0} produk</span>
          </div>
        </Section>

        {/* Oranges by Category */}
        <Section title="Produk Jeruk per Kategori">
          <DataTable
            headers={['Kategori', 'Jumlah', 'Total Stok (kg)']}
            rows={(oranges?.by_category ?? []).map((r) => [
              r.category,
              r.count,
              formatNumber(r.stock_kg),
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Leads by Status */}
        <Section title="Leads per Status">
          <DataTable
            headers={['Status', 'Jumlah']}
            rows={(leads?.by_status ?? []).map((r) => [
              <StatusBadge status={r.status} />,
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Leads by Source */}
        <Section title="Leads per Sumber">
          <DataTable
            headers={['Sumber', 'Jumlah']}
            rows={(leads?.by_source ?? []).map((r) => [
              r.source || 'Tidak diketahui',
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
        </Section>

        {/* Rentals by Status */}
        <Section title="Rental per Status">
          <DataTable
            headers={['Status', 'Jumlah', 'Pendapatan']}
            rows={(rentals?.by_status ?? []).map((r) => [
              <StatusBadge status={r.status} />,
              r.count,
              formatRupiah(r.revenue ?? 0),
            ])}
            emptyMessage="Belum ada data"
          />
          <div className="mt-3 border-t pt-3 text-sm text-gray-500">
            Total pendapatan rental: <span className="font-semibold text-primary">{formatRupiah(rentals?.total_revenue ?? 0)}</span>
          </div>
        </Section>

        {/* Users by Role */}
        <Section title="Pengguna per Role">
          <DataTable
            headers={['Role', 'Jumlah']}
            rows={(users?.by_role ?? []).map((r) => [
              r.role ? r.role.charAt(0).toUpperCase() + r.role.slice(1).replace('_', ' ') : '-',
              r.count,
            ])}
            emptyMessage="Belum ada data"
          />
          <div className="mt-3 border-t pt-3 text-sm text-gray-500">
            Pengguna baru bulan ini: <span className="font-semibold text-secondary">{users?.new_this_month ?? 0}</span>
          </div>
        </Section>
      </div>
    </div>
  );
}
