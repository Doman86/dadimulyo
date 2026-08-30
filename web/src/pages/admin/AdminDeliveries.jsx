import { useCallback, useEffect, useState } from 'react';
import { createDelivery, deleteDelivery, fetchDeliveries, updateDeliveryStatus } from '../../api/deliveries';
import { fetchOrders } from '../../api/orders';
import { fetchTrucks } from '../../api/trucks';
import { fetchUsers } from '../../api/leads';
import { formatRupiah } from '../../utils/format';
import Reveal from '../../components/Reveal';
import siteConfig from '../../config/site';

const STATUSES = [
  { value: 'pending', label: 'Menunggu', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
  { value: 'assigned', label: 'Truck Ditugaskan', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
  { value: 'in_transit', label: 'Dalam Perjalanan', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
  { value: 'delivered', label: 'Terkirim', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border border-red-100' },
];
const STATUS_COLORS = Object.fromEntries(STATUSES.map((s) => [s.value, s.color]));

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ order_id: '', truck_id: '', driver_id: '', pickup_address: siteConfig.address.pickupDefault, destination_address: '', shipping_cost: '', scheduled_at: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ status: '', truck_id: '', driver_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchDeliveries(statusFilter ? { status: statusFilter, per_page: 50 } : { per_page: 50 })
      .then((result) => setDeliveries(result.data))
      .catch(() => setError('Gagal memuat data pengiriman.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchOrders({ per_page: 50 }).then((r) => setOrders(r.data)).catch(() => {});
    fetchTrucks({ per_page: 50 }).then((r) => setTrucks(r.data)).catch(() => {});
    fetchUsers({ role: 'driver' }).then(setDrivers).catch(() => {});
  }, []);

  const setCreate = (key) => (e) => setCreateForm({ ...createForm, [key]: e.target.value });

  async function handleCreate(e) {
    e.preventDefault(); setCreating(true); setError(null);
    try {
      await createDelivery({ order_id: Number(createForm.order_id), truck_id: createForm.truck_id ? Number(createForm.truck_id) : undefined, driver_id: createForm.driver_id ? Number(createForm.driver_id) : undefined, pickup_address: createForm.pickup_address || undefined, destination_address: createForm.destination_address || undefined, shipping_cost: createForm.shipping_cost === '' ? undefined : Number(createForm.shipping_cost), scheduled_at: createForm.scheduled_at || undefined, notes: createForm.notes || undefined });
      setShowCreate(false); setCreateForm({ order_id: '', truck_id: '', driver_id: '', pickup_address: siteConfig.address.pickupDefault, destination_address: '', shipping_cost: '', scheduled_at: '', notes: '' }); load();
    } catch (err) { setError(err.response?.data?.message || 'Gagal membuat pengiriman.'); } finally { setCreating(false); }
  }

  function openEdit(delivery) {
    setEditingId(delivery.id);
    setDraft({ status: delivery.status, truck_id: delivery.truck_id || '', driver_id: delivery.driver_id || '', notes: delivery.notes || '' });
    setError(null);
  }

  async function saveEdit(delivery) {
    setSaving(true); setError(null);
    try { await updateDeliveryStatus(delivery.id, { status: draft.status, truck_id: draft.truck_id ? Number(draft.truck_id) : undefined, driver_id: draft.driver_id ? Number(draft.driver_id) : undefined, notes: draft.notes || undefined }); setEditingId(null); load(); }
    catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan perubahan.'); } finally { setSaving(false); }
  }

  async function handleDelete(delivery) {
    if (!window.confirm('Hapus pengiriman ini?')) return;
    try { await deleteDelivery(delivery.id); load(); } catch { setError('Gagal menghapus pengiriman.'); }
  }

  const inputCls = 'input-lux';

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Pengiriman</h1>
            <p className="mt-1 text-sm text-gray-400">Atur pengiriman pesanan dengan truck &amp; sopir.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold">{showCreate ? 'Tutup Form' : '+ Buat Pengiriman'}</button>
        </div>
      </Reveal>

      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      {showCreate && (
        <Reveal>
          <form onSubmit={handleCreate} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-display font-bold text-charcoal">Pengiriman Baru</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="label-lux">Pesanan *</label><select required value={createForm.order_id} onChange={setCreate('order_id')} className={`${inputCls} w-full`}><option value="">Pilih pesanan</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} — {o.customer?.name}</option>)}</select></div>
              <div><label className="label-lux">Truck</label><select value={createForm.truck_id} onChange={setCreate('truck_id')} className={`${inputCls} w-full`}><option value="">Tanpa truck</option>{trucks.map((t) => <option key={t.id} value={t.id}>{t.brand} {t.model}</option>)}</select></div>
              <div><label className="label-lux">Sopir</label><select value={createForm.driver_id} onChange={setCreate('driver_id')} className={`${inputCls} w-full`}><option value="">Tanpa sopir</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="label-lux">Ambil dari</label><input value={createForm.pickup_address} onChange={setCreate('pickup_address')} className={`${inputCls} w-full`} /></div>
              <div><label className="label-lux">Tujuan</label><input value={createForm.destination_address} onChange={setCreate('destination_address')} className={`${inputCls} w-full`} /></div>
              <div><label className="label-lux">Ongkir (Rp)</label><input type="number" min="0" value={createForm.shipping_cost} onChange={setCreate('shipping_cost')} className={`${inputCls} w-full`} /></div>
              <div><label className="label-lux">Jadwal</label><input type="date" value={createForm.scheduled_at} onChange={setCreate('scheduled_at')} className={`${inputCls} w-full`} /></div>
              <div className="sm:col-span-2"><label className="label-lux">Catatan</label><input value={createForm.notes} onChange={setCreate('notes')} placeholder="Catatan pengiriman..." className={`${inputCls} w-full`} /></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={creating} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">{creating ? 'Menyimpan...' : 'Simpan Pengiriman'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50">Batal</button>
            </div>
          </form>
        </Reveal>
      )}

      {/* Status filters */}
      <Reveal delay={50}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter('')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === '' ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>Semua</button>
          {STATUSES.map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === s.value ? 'bg-forest text-gold-light shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'}`}>{s.label}</button>
          ))}
        </div>
      </Reveal>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 text-sm text-gray-400">Belum ada pengiriman.</p>
        </div></Reveal>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery, i) => (
            <Reveal key={delivery.id} variant="up" delay={i * 30}>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gold/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-charcoal">{delivery.order?.order_number || `Pengiriman #${delivery.id}`}</p>
                    <p className="text-xs text-gray-400">🚛 {delivery.truck ? `${delivery.truck.brand} ${delivery.truck.model}` : 'Truck belum ditugaskan'}{delivery.driver ? ` · Sopir: ${delivery.driver.name}` : ''}{delivery.scheduled_at ? ` · ${delivery.scheduled_at}` : ''}</p>
                    {delivery.destination_address && <p className="text-xs text-gray-400">Tujuan: {delivery.destination_address}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {delivery.shipping_cost > 0 && <p className="font-extrabold text-primary text-sm">{formatRupiah(delivery.shipping_cost)}</p>}
                      <span className={`mt-1 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[delivery.status] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                        {(STATUSES.find((s) => s.value === delivery.status) || { label: delivery.status }).label}
                      </span>
                    </div>
                    <button onClick={() => openEdit(delivery)} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100">Kelola</button>
                    <button onClick={() => handleDelete(delivery)} className="rounded-xl px-3 py-2 text-red-500 transition-all hover:bg-red-50" title="Hapus">✕</button>
                  </div>
                </div>

                {editingId === delivery.id && (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div><label className="label-lux">Status</label><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={`${inputCls} w-full`}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                    <div><label className="label-lux">Truck</label><select value={draft.truck_id} onChange={(e) => setDraft({ ...draft, truck_id: e.target.value })} className={`${inputCls} w-full`}><option value="">Tanpa truck</option>{trucks.map((t) => <option key={t.id} value={t.id}>{t.brand} {t.model}</option>)}</select></div>
                    <div><label className="label-lux">Sopir</label><select value={draft.driver_id} onChange={(e) => setDraft({ ...draft, driver_id: e.target.value })} className={`${inputCls} w-full`}><option value="">Tanpa sopir</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div><label className="label-lux">Catatan</label><input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={`${inputCls} w-full`} /></div>
                    <div className="flex gap-2 lg:col-span-4">
                      <button onClick={() => saveEdit(delivery)} disabled={saving} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
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
