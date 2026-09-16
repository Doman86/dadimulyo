import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads, updateLead } from '../../api/leads';
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
  const [updatingId, setUpdatingId] = useState(null);
  const [notesFor, setNotesFor] = useState(null); // id lead yang sedang diedit catatannya
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    setLoading(true);
    fetchLeads({ per_page: 50 })
      .then((result) => setLeads(result.data || []))
      .catch(() => setToast({ type: 'error', text: 'Gagal memuat lead.' }))
      .finally(() => setLoading(false));
  }

  function flash(text, type = 'success') {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2500);
  }

  async function changeStatus(lead, status) {
    setUpdatingId(lead.id);
    try {
      const updated = await updateLead(lead.id, { status });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      flash(`Status lead "${lead.name}" diperbarui.`);
    } catch {
      flash('Gagal memperbarui status lead.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveNotes(lead) {
    setSavingNotes(true);
    try {
      const updated = await updateLead(lead.id, { notes: notesDraft });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setNotesFor(null);
      flash('Catatan follow-up disimpan.');
    } catch {
      flash('Gagal menyimpan catatan.', 'error');
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.text}
        </div>
      )}

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
                  <div key={lead.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
                          {lead.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.phone} {lead.truck ? `· ${lead.truck.brand} ${lead.truck.model}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${statuses.find((s) => s[0] === lead.status)?.[2] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{lead.status}</span>
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(e) => changeStatus(lead, e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 focus:border-gold focus:outline-none disabled:opacity-50"
                        >
                          {statuses.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setNotesFor(notesFor === lead.id ? null : lead.id);
                            setNotesDraft(lead.notes || '');
                          }}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gold/40 hover:text-charcoal"
                        >
                          {notesFor === lead.id ? 'Tutup' : 'Catatan'}
                        </button>
                      </div>
                    </div>

                    {notesFor === lead.id && (
                      <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                        <label className="text-xs font-semibold text-gray-500">Catatan follow-up</label>
                        <textarea
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          rows={3}
                          placeholder="Contoh: sudah dihubungi via WA, tertarik unit FD 110, follow up minggu depan..."
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button onClick={() => setNotesFor(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-charcoal">Batal</button>
                          <button
                            onClick={() => saveNotes(lead)}
                            disabled={savingNotes}
                            className="rounded-lg bg-forest px-3 py-1.5 text-xs font-bold text-gold-light disabled:opacity-60"
                          >
                            {savingNotes ? 'Menyimpan...' : 'Simpan Catatan'}
                          </button>
                        </div>
                      </div>
                    )}
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
