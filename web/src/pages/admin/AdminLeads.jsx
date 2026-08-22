import { useCallback, useEffect, useState } from 'react';
import { deleteLead, fetchLeads, fetchUsers, updateLead } from '../../api/leads';
import { useAuth } from '../../context/AuthContext';

const STATUSES = [
  { value: 'new', label: 'Baru', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Dihubungi', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'negotiating', label: 'Negosiasi', color: 'bg-purple-100 text-purple-700' },
  { value: 'won', label: 'Menang', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Gagal', color: 'bg-red-100 text-red-700' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
  );
}

export default function AdminLeads() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'admin';

  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Expanded row id -> draft { status, notes, sales_id }
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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers({ role: 'sales' }).then(setSalesUsers).catch(() => {});
    }
  }, [isAdmin]);

  function openEdit(lead) {
    setEditingId(lead.id);
    setDraft({ status: lead.status, notes: lead.notes || '', sales_id: lead.sales_id || '' });
    setError(null);
  }

  async function saveEdit(lead) {
    setSaving(true);
    setError(null);
    try {
      await updateLead(lead.id, {
        status: draft.status,
        notes: draft.notes,
        sales_id: draft.sales_id ? Number(draft.sales_id) : undefined,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lead) {
    if (!window.confirm(`Hapus lead dari "${lead.name}"?`)) return;
    try {
      await deleteLead(lead.id);
      load();
    } catch {
      setError('Gagal menghapus lead.');
    }
  }

  const inputCls = 'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Leads</h1>
          <p className="text-sm text-gray-600">Calon pelanggan dari form "Hubungi Sales".</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              statusFilter === '' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                statusFilter === s.value ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : leads.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada lead.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {lead.name}{' '}
                      <span className="font-normal text-gray-500">· {lead.phone}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {lead.truck ? `Tertarik: ${lead.truck.brand} ${lead.truck.model}` : 'Inquiry umum'}
                      {lead.source ? ` · Sumber: ${lead.source}` : ''}
                      {' · '}
                      {new Date(lead.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(lead.status)}
                  <button
                    onClick={() => openEdit(lead)}
                    className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
                  >
                    Kelola
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(lead)}
                      className="rounded px-2 text-red-600 hover:bg-red-50"
                      title="Hapus lead"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {lead.message && (
                <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  💬 {lead.message}
                </p>
              )}

              {editingId === lead.id && (
                <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Status</label>
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Tugaskan ke Sales
                      </label>
                      <select
                        value={draft.sales_id}
                        onChange={(e) => setDraft({ ...draft, sales_id: e.target.value })}
                        className={`mt-1 ${inputCls} w-full`}
                      >
                        <option value="">Belum ditugaskan</option>
                        {salesUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600">
                      Catatan / Follow-up
                    </label>
                    <textarea
                      rows={3}
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                      placeholder="Catatan hasil follow-up..."
                      className={`mt-1 ${inputCls} w-full`}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      onClick={() => saveEdit(lead)}
                      disabled={saving}
                      className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
