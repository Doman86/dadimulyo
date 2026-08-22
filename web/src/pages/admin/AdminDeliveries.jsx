import { useCallback, useEffect, useState } from 'react';
import { createDelivery, deleteDelivery, fetchDeliveries, updateDeliveryStatus } from '../../api/deliveries';
import { fetchOrders } from '../../api/orders';
import { fetchTrucks } from '../../api/trucks';
import { fetchUsers } from '../../api/leads';
import { formatRupiah } from '../../utils/format';

const STATUSES = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'assigned', label: 'Truck Ditugaskan' },
  { value: 'in_transit', label: 'Dalam Perjalanan' },
  { value: 'delivered', label: 'Terkirim' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    order_id: '',
    truck_id: '',
    driver_id: '',
    pickup_address: 'Kebun Dadi Mulyo, Wagir, Malang',
    destination_address: '',
    shipping_cost: '',
    scheduled_at: '',
    notes: '',
  });
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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchOrders({ per_page: 50 }).then((r) => setOrders(r.data)).catch(() => {});
    fetchTrucks({ per_page: 50 }).then((r) => setTrucks(r.data)).catch(() => {});
    fetchUsers({ role: 'driver' }).then(setDrivers).catch(() => {});
  }, []);

  const setCreate = (key) => (e) => setCreateForm({ ...createForm, [key]: e.target.value });

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createDelivery({
        order_id: Number(createForm.order_id),
        truck_id: createForm.truck_id ? Number(createForm.truck_id) : undefined,
        driver_id: createForm.driver_id ? Number(createForm.driver_id) : undefined,
        pickup_address: createForm.pickup_address || undefined,
        destination_address: createForm.destination_address || undefined,
        shipping_cost: createForm.shipping_cost === '' ? undefined : Number(createForm.shipping_cost),
        scheduled_at: createForm.scheduled_at || undefined,
        notes: createForm.notes || undefined,
      });
      setShowCreate(false);
      setCreateForm({
        order_id: '',
        truck_id: '',
        driver_id: '',
        pickup_address: 'Kebun Dadi Mulyo, Wagir, Malang',
        destination_address: '',
        shipping_cost: '',
        scheduled_at: '',
        notes: '',
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pengiriman.');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(delivery) {
    setEditingId(delivery.id);
    setDraft({
      status: delivery.status,
      truck_id: delivery.truck_id || '',
      driver_id: delivery.driver_id || '',
      notes: delivery.notes || '',
    });
    setError(null);
  }

  async function saveEdit(delivery) {
    setSaving(true);
    setError(null);
    try {
      await updateDeliveryStatus(delivery.id, {
        status: draft.status,
        truck_id: draft.truck_id ? Number(draft.truck_id) : undefined,
        driver_id: draft.driver_id ? Number(draft.driver_id) : undefined,
        notes: draft.notes || undefined,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(delivery) {
    if (!window.confirm('Hapus pengiriman ini?')) return;
    try {
      await deleteDelivery(delivery.id);
      load();
    } catch {
      setError('Gagal menghapus pengiriman.');
    }
  }

  const inputCls = 'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Pengiriman</h1>
          <p className="text-sm text-gray-600">Atur pengiriman pesanan dengan truck &amp; sopir.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {showCreate ? 'Tutup Form' : '+ Buat Pengiriman'}
        </button>
      </div>

      {error && <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mt-5 rounded-lg border bg-white p-5">
          <h2 className="font-semibold text-gray-900">Pengiriman Baru</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pesanan *</label>
              <select required value={createForm.order_id} onChange={setCreate('order_id')} className={`mt-1 ${inputCls} w-full`}>
                <option value="">Pilih pesanan</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — {o.customer?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Truck</label>
              <select value={createForm.truck_id} onChange={setCreate('truck_id')} className={`mt-1 ${inputCls} w-full`}>
                <option value="">Tanpa truck</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.brand} {t.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sopir</label>
              <select value={createForm.driver_id} onChange={setCreate('driver_id')} className={`mt-1 ${inputCls} w-full`}>
                <option value="">Tanpa sopir</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ambil dari</label>
              <input value={createForm.pickup_address} onChange={setCreate('pickup_address')} className={`mt-1 ${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tujuan</label>
              <input value={createForm.destination_address} onChange={setCreate('destination_address')} className={`mt-1 ${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ongkir (Rp)</label>
              <input type="number" min="0" value={createForm.shipping_cost} onChange={setCreate('shipping_cost')} className={`mt-1 ${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jadwal</label>
              <input type="date" value={createForm.scheduled_at} onChange={setCreate('scheduled_at')} className={`mt-1 ${inputCls} w-full`} />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <input value={createForm.notes} onChange={setCreate('notes')} placeholder="Catatan pengiriman..." className={`mt-1 ${inputCls} w-full`} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Menyimpan...' : 'Simpan Pengiriman'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Status filter */}
      <div className="mt-5 flex flex-wrap gap-2">
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

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : deliveries.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada pengiriman.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">
                    {delivery.order?.order_number || `Pengiriman #${delivery.id}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    🚛 {delivery.truck ? `${delivery.truck.brand} ${delivery.truck.model}` : 'Truck belum ditugaskan'}
                    {delivery.driver ? ` · Sopir: ${delivery.driver.name}` : ''}
                    {delivery.scheduled_at ? ` · ${delivery.scheduled_at}` : ''}
                  </div>
                  {delivery.destination_address && (
                    <div className="mt-1 text-xs text-gray-500">Tujuan: {delivery.destination_address}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {delivery.shipping_cost > 0 && (
                      <div className="font-bold text-primary">{formatRupiah(delivery.shipping_cost)}</div>
                    )}
                    <div className="mt-1">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[delivery.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {(STATUSES.find((s) => s.value === delivery.status) || { label: delivery.status }).label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(delivery)}
                    className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
                  >
                    Kelola
                  </button>
                  <button
                    onClick={() => handleDelete(delivery)}
                    className="rounded px-2 text-red-600 hover:bg-red-50"
                    title="Hapus pengiriman"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editingId === delivery.id && (
                <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <label className="block text-xs font-semibold text-gray-600">Truck</label>
                    <select
                      value={draft.truck_id}
                      onChange={(e) => setDraft({ ...draft, truck_id: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    >
                      <option value="">Tanpa truck</option>
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.brand} {t.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Sopir</label>
                    <select
                      value={draft.driver_id}
                      onChange={(e) => setDraft({ ...draft, driver_id: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    >
                      <option value="">Tanpa sopir</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Catatan</label>
                    <input
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                      className={`mt-1 ${inputCls} w-full`}
                    />
                  </div>
                  <div className="flex gap-2 lg:col-span-4">
                    <button
                      onClick={() => saveEdit(delivery)}
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
