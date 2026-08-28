import { useCallback, useEffect, useState } from 'react';
import { fetchOrders, updateOrderStatus } from '../../api/orders';
import { formatRupiah } from '../../utils/format';
import { whatsappUrl } from '../../utils/contact';
import Reveal from '../../components/Reveal';

const STATUSES = [
  { value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' }, { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];
const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Belum Bayar' }, { value: 'paid', label: 'Lunas' },
  { value: 'refunded', label: 'Dikembalikan' },
];
const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  confirmed: 'bg-blue-50 text-blue-600 border border-blue-100',
  processing: 'bg-purple-50 text-purple-600 border border-purple-100',
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
};

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

  useEffect(() => { load(); }, [load]);

  function openEdit(order) {
    setEditingId(order.id);
    setDraft({ status: order.status, payment_status: order.payment_status, shipping_cost: order.shipping_cost ?? '' });
    setError(null);
  }

  async function saveEdit(order) {
    setSaving(true); setError(null);
    try {
      await updateOrderStatus(order.id, { status: draft.status, payment_status: draft.payment_status, shipping_cost: draft.shipping_cost === '' ? undefined : Number(draft.shipping_cost) });
      setEditingId(null); load();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan perubahan.'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Pesanan</h1>
            <p className="mt-1 text-sm text-gray-400">Ubah status pesanan dan pembayaran.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStatusFilter('')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === '' ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>Semua</button>
            {STATUSES.map((s) => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === s.value ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>{s.label}</button>
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
      ) : orders.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 text-sm text-gray-400">Belum ada pesanan.</p>
        </div></Reveal>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <Reveal key={order.id} variant="up" delay={i * 30}>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gold/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-charcoal">{order.order_number}</p>
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {order.customer?.name} · {order.customer?.phone} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400">{order.items?.length ?? 0} item{order.delivery ? ' · 🚛 Ada pengiriman' : ''}</p>
                    {(order.customer?.phone || order.shipping_address?.phone) && (
                      <div className="mt-2 flex gap-2">
                        <a href={whatsappUrl(order.customer?.phone || order.shipping_address?.phone, `Halo ${order.customer?.name || order.shipping_address?.recipient_name || 'Bapak/Ibu'}, kami dari Dadi Mulyo terkait pesanan ${order.order_number}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          WhatsApp
                        </a>
                        <a href={`tel:${order.customer?.phone || order.shipping_address?.phone}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50">Telepon</a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-extrabold text-primary text-sm">{formatRupiah(order.total)}</p>
                      <p className="text-xs text-gray-400">{order.payment_status}</p>
                    </div>
                    <button onClick={() => openEdit(order)} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100">Kelola</button>
                  </div>
                </div>

                {editingId === order.id && (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/[0.02] p-5 sm:grid-cols-3">
                    <div>
                      <label className="label-lux">Status</label>
                      <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className="input-lux w-full">
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-lux">Pembayaran</label>
                      <select value={draft.payment_status} onChange={(e) => setDraft({ ...draft, payment_status: e.target.value })} className="input-lux w-full">
                        {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-lux">Ongkir (Rp)</label>
                      <input type="number" min="0" value={draft.shipping_cost} onChange={(e) => setDraft({ ...draft, shipping_cost: e.target.value })} className="input-lux w-full" />
                    </div>
                    <div className="flex gap-2 sm:col-span-3">
                      <button onClick={() => saveEdit(order)} disabled={saving} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
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
