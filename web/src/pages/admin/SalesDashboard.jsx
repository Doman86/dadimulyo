import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads } from '../../api/leads';
import Reveal from '../../components/Reveal';

const statuses = [
  ['new', 'Baru', 'bg-blue-50 text-blue-600 border border-blue-100'],
  ['contacted', 'Dihubungi', 'bg-amber-50 text-amber-600 border border-amber-100'],
  ['negotiating', 'Negosiasi', 'bg-purple-50 text-purple-600 border border-purple-100'],
  ['won', 'Menang', 'bg-emerald-50 text-emerald-600 border border-emerald-100'],
  ['lost', 'Gagal', 'bg-red-50 text-red-600 border border-red-100'],
];

export default function SalesDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads({ per_page: 50 }).then((result) => setLeads(result.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Dashboard Sales</h1>
            <p className="mt-1 text-sm text-gray-400">Pantau dan tindak lanjuti calon pelanggan Anda.</p>
          </div>
          <Link to="/admin/leads" className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold">Kelola Leads</Link>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statuses.map(([value, label, color], i) => (
          <Reveal key={value} variant="up" delay={i * 50}>
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:border-gold/30 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>
                <p className="mt-3 text-3xl font-extrabold text-charcoal">{leads.filter((lead) => lead.status === value).length}</p>
                <p className="mt-1 text-xs text-gray-400">lead</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-6 py-4">
            <h2 className="font-display font-bold text-charcoal">Lead Terbaru</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
              </div>
            ) : leads.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada lead.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {leads.slice(0, 8).map((lead) => (
                  <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
                        {lead.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.phone} {lead.truck ? `· ${lead.truck.brand} ${lead.truck.model}` : ''}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${statuses.find((s) => s[0] === lead.status)?.[2] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{lead.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
