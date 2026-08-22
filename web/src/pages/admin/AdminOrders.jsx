import { useCallback, useEffect, useState } from 'react';
import { fetchOrders, updateOrderStatus } from '../../api/orders';
import { formatRupiah } from '../../utils/format';

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Belum Bayar' },
  { value: 'paid', label: 'Lunas' },
  { value: 'refunded', label: 'Dikembalikan' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ status: '', payment_status: '', shipping_cost: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchOrders(statusFilter ? { status: statusFilter, per_page: 50 } : { per_page: 50 })
      .then((result) => setOrders(result.data))
      .catch(() => setError('Gagal memuat data pesanan.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(order) {
    setEditingId(order.id);
    setDraft({
      status: order.status,
      payment_status: order.payment_status,
      shipping_cost: order.shipping_cost ?? '',
    });
    setError(null);
  }

  async function saveEdit(order) {
    setSaving(true);
    setError(null);
    try {
      await updateOrderStatus(order.id, {
        status: draft.status,
        payment_status: draft.payment_status,
        shipping_cost: draft.shipping_cost === '' ? undefined : Number(draft.shipping_cost),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Pesanan</h1>
          <p className="text-sm text-gray-600">Ubah status pesanan dan pembayaran.</p>
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

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada pesanan.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{order.order_number}</div>
                  <div className="text-xs text-gray-500">
                    {order.customer?.name} · {order.customer?.phone} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {order.items?.length ?? 0} item
                    {order.delivery ? ' · 🚛 Ada pengiriman' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatRupiah(order.total)}</div>
                    <div className="text-xs text-gray-500">
                      {order.status} · {order.payment_status}
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(order)}
                    className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
                  >
                    Kelola
                  </button>
                </div>
              </div>

              {editingId === order.id && (
                <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 sm:grid-cols-3">
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
                    <label className="block text-xs font-semibold text-gray-600">Pembayaran</label>
                    <select
                      value={draft.payment_status}
                      onChange={(e) => setDraft({ ...draft, payment_status: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Ongkir (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={draft.shipping_cost}
                      onChange={(e) => setDraft({ ...draft, shipping_cost: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-3">
                    <button
                      onClick={() => saveEdit(order)}
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
