import { useCallback, useEffect, useState } from 'react';
import { deleteLead, fetchLeads, fetchUsers, updateLead } from '../../api/leads';
import { useAuth } from '../../context/AuthContext';
import Reveal from '../../components/Reveal';

const STATUSES = [
  { value: 'new', label: 'Baru', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
  { value: 'contacted', label: 'Dihubungi', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
  { value: 'negotiating', label: 'Negosiasi', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
  { value: 'won', label: 'Menang', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  { value: 'lost', label: 'Gagal', color: 'bg-red-50 text-red-600 border border-red-100' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-50 text-gray-600 border border-gray-100' };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

export default function AdminLeads() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'admin';
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ status: '', notes: '', sales_id: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchLeads(statusFilter ? { status: statusFilter, per_page: 50 } : { per_page: 50 })
      .then((result) => setLeads(result.data))
      .catch(() => setError('Gagal memuat data lead.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (isAdmin) fetchUsers({ role: 'sales' }).then(setSalesUsers).catch(() => {}); }, [isAdmin]);

  function openEdit(lead) {
    setEditingId(lead.id);
    setDraft({ status: lead.status, notes: lead.notes || '', sales_id: lead.sales_id || '' });
    setError(null);
  }

  async function saveEdit(lead) {
    setSaving(true); setError(null);
    try {
      await updateLead(lead.id, { status: draft.status, notes: draft.notes, sales_id: draft.sales_id ? Number(draft.sales_id) : undefined });
      setEditingId(null); load();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan perubahan.'); } finally { setSaving(false); }
  }

  async function handleDelete(lead) {
    if (!window.confirm(`Hapus lead dari "${lead.name}"?`)) return;
    try { await deleteLead(lead.id); load(); } catch { setError('Gagal menghapus lead.'); }
  }

  const inputCls = 'input-lux';

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Leads</h1>
            <p className="mt-1 text-sm text-gray-400">Calon pelanggan dari form "Hubungi Sales".</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStatusFilter('')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === '' ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30 hover:text-charcoal'}`}>Semua</button>
            {STATUSES.map((s) => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === s.value ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30 hover:text-charcoal'}`}>{s.label}</button>
            ))}
          </div>
        </div>
      </Reveal>

      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : leads.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 text-sm text-gray-400">Belum ada lead.</p>
        </div></Reveal>
      ) : (
        <div className="space-y-3">
          {leads.map((lead, i) => (
            <Reveal key={lead.id} variant="up" delay={i * 30}>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gold/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">{lead.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <p className="font-semibold text-charcoal">{lead.name} <span className="font-normal text-gray-400">· {lead.phone}</span></p>
                      <p className="text-xs text-gray-400">
                        {lead.truck ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}
                        {lead.source ? ` · Sumber: ${lead.source}` : ''}
                        {' · '}{new Date(lead.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(lead.status)}
                    <button onClick={() => openEdit(lead)} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100 hover:border-gray-200">Kelola</button>
                    {isAdmin && <button onClick={() => handleDelete(lead)} className="rounded-xl px-3 py-2 text-red-500 transition-all hover:bg-red-50" title="Hapus">✕</button>}
                  </div>
                </div>

                {lead.message && <p className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">💬 {lead.message}</p>}

                {editingId === lead.id && (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/[0.02] p-5 sm:grid-cols-2">
                    <div>
                      <label className="label-lux">Status</label>
                      <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={`${inputCls} w-full`}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    {isAdmin && (
                      <div>
                        <label className="label-lux">Tugaskan ke Sales</label>
                        <select value={draft.sales_id} onChange={(e) => setDraft({ ...draft, sales_id: e.target.value })} className={`${inputCls} w-full`}>
                          <option value="">Belum ditugaskan</option>
                          {salesUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="label-lux">Catatan / Follow-up</label>
                      <textarea rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Catatan hasil follow-up..." className={`${inputCls} w-full`} />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <button onClick={() => saveEdit(lead)} disabled={saving} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
                      <button onClick={() => setEditingId(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50">Batal</button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
