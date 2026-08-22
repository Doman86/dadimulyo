import { useCallback, useEffect, useState } from 'react';
import { deleteRental, fetchRentals, updateRental } from '../../api/trucks';
import { formatNumber, formatRupiah } from '../../utils/format';

const STATUSES = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'Berjalan', color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
  );
}

export default function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ status: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchRentals(statusFilter ? { status: statusFilter, per_page: 50 } : { per_page: 50 })
      .then((result) => setRentals(result.data))
      .catch(() => setError('Gagal memuat data rental.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(rental) {
    setEditingId(rental.id);
    setDraft({ status: rental.status, notes: rental.notes || '' });
    setError(null);
  }

  async function saveEdit(rental) {
    setSaving(true);
    setError(null);
    try {
      await updateRental(rental.id, { status: draft.status, notes: draft.notes });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rental) {
    if (
      !window.confirm(
        `Hapus booking ${rental.truck?.brand} ${rental.truck?.model} (${rental.customer?.name})?`
      )
    )
      return;
    try {
      await deleteRental(rental.id);
      load();
    } catch {
      setError('Gagal menghapus rental.');
    }
  }

  const inputCls =
    'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Rental</h1>
          <p className="text-sm text-gray-600">Booking sewa truck dari pelanggan.</p>
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
      ) : rentals.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada booking rental.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {rentals.map((rental) => (
            <div key={rental.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 overflow-hidden rounded bg-gray-100">
                    {rental.truck?.image_url ? (
                      <img
                        src={rental.truck.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">🚛</div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rental.truck?.brand} {rental.truck?.model}
                      {rental.truck?.year ? ` (${rental.truck.year})` : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rental.start_date} → {rental.end_date} · {rental.days} hari ·{' '}
                      {formatRupiah(rental.price_per_day)}/hari
                    </div>
                    <div className="text-xs text-gray-500">
                      👤 {rental.customer?.name || '-'}
                      {rental.customer?.phone ? ` · ${rental.customer.phone}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatRupiah(rental.total_price)}
                    </div>
                    {statusBadge(rental.status)}
                  </div>
                  <button
                    onClick={() => openEdit(rental)}
                    className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
                  >
                    Kelola
                  </button>
                  <button
                    onClick={() => handleDelete(rental)}
                    className="rounded px-2 text-red-600 hover:bg-red-50"
                    title="Hapus booking"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {rental.notes && (
                <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  📝 {rental.notes}
                </p>
              )}

              {editingId === rental.id && (
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">
                      Catatan (opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      onClick={() => saveEdit(rental)}
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
