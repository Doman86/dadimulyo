import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads } from '../../api/leads';

const statuses = [
  ['new', 'Baru', 'bg-blue-100 text-blue-700'],
  ['contacted', 'Dihubungi', 'bg-yellow-100 text-yellow-700'],
  ['negotiating', 'Negosiasi', 'bg-purple-100 text-purple-700'],
  ['won', 'Menang', 'bg-green-100 text-green-700'],
  ['lost', 'Gagal', 'bg-red-100 text-red-700'],
];

export default function SalesDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads({ per_page: 50 })
      .then((result) => setLeads(result.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-primary">Dashboard Sales</h1><p className="text-sm text-gray-600">Pantau dan tindak lanjuti calon pelanggan Anda.</p></div>
        <Link to="/admin/leads" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">Kelola Leads</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statuses.map(([value, label, color]) => <div key={value} className="rounded-lg border bg-white p-4"><div className={`inline-block rounded px-2 py-1 text-xs font-semibold ${color}`}>{label}</div><div className="mt-2 text-2xl font-bold text-gray-900">{leads.filter((lead) => lead.status === value).length}</div><div className="text-xs text-gray-500">lead</div></div>)}
      </div>
      <section className="mt-8 rounded-lg border bg-white p-5">
        <h2 className="font-semibold text-gray-900">Lead terbaru</h2>
        {loading ? <p className="mt-4 text-sm text-gray-500">Memuat data...</p> : leads.length === 0 ? <p className="mt-4 text-sm text-gray-500">Belum ada lead.</p> : <div className="mt-4 divide-y">{leads.slice(0, 8).map((lead) => <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><div className="font-medium text-gray-900">{lead.name}</div><div className="text-xs text-gray-500">{lead.phone} {lead.truck ? `· ${lead.truck.brand} ${lead.truck.model}` : ''}</div></div><span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{lead.status}</span></div>)}</div>}
      </section>
    </div>
  );
}