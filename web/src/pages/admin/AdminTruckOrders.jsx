
import { useCallback, useEffect, useState } from 'react';
import { fetchTruckOrders, updateTruckOrderStatus } from '../../api/payments';
import { formatRupiah } from '../../utils/format';
import { whatsappUrl } from '../../utils/contact';
import Reveal from '../../components/Reveal';
import siteConfig from '../../config/site';

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Belum Bayar' },
  { value: 'pending', label: 'Menunggu Verifikasi' },
  { value: 'paid', label: 'Lunas' },
  { value: 'failed', label: 'Gagal' },
  { value: 'refunded', label: 'Dikembalikan' },
];

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  confirmed: 'bg-blue-50 text-blue-600 border border-blue-100',
  processing: 'bg-purple-50 text-purple-600 border border-purple-100',
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
};

const PAYMENT_COLORS = {
  unpaid: 'bg-gray-50 text-gray-500 border border-gray-100',
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  paid: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  failed: 'bg-red-50 text-red-600 border border-red-100',
  refunded: 'bg-purple-50 text-purple-600 border border-purple-100',
};

export default function AdminTruckOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [proofId, setProofId] = useState(null);
  const [draft, setDraft] = useState({
    status: '',
    payment_status: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);

    fetchTruckOrders(
      statusFilter
        ? { status: statusFilter, per_page: 50 }
        : { per_page: 50 }
    )
      .then((result) => setOrders(result.data))
      .catch(() => setError('Gagal memuat data pesanan truck.'))
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
    });
    setError(null);
  }

  async function saveEdit(order) {
    setSaving(true);
    setError(null);

    try {
      await updateTruckOrderStatus(order.id, {
        status: draft.status,
        payment_status: draft.payment_status,
      });

      setEditingId(null);
      load();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan perubahan.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">
              Pesanan Truck
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Konfirmasi pembelian truck dan verifikasi bukti transfer.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                statusFilter === ''
                  ? 'bg-forest text-gold-light shadow-md'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'
              }`}
            >
              Semua
            </button>

            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  statusFilter === s.value
                    ? 'bg-forest text-gold-light shadow-md'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gold/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {error && (
        <Reveal>
          <div className="alert-lux-error">{error}</div>
        </Reveal>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />

          <p className="mt-4 text-sm text-gray-400">
            Memuat data...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <Reveal>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
            <p className="text-4xl">🚛</p>

            <p className="mt-3 text-sm text-gray-400">
              Belum ada pesanan truck.
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const manualPayments = (order.payments || []).filter(
              (p) =>
                p.payment_method === 'transfer' ||
                p.payment_method === 'cod'
            );

            const pendingPayments = manualPayments.filter(
              (p) => p.status === 'pending'
            );

            return (
              <Reveal
                key={order.id}
                variant="up"
                delay={i * 30}
              >
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gold/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-charcoal">
                          {order.order_number}
                        </p>

                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                            STATUS_COLORS[order.status] ||
                            'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}
                        >
                          {order.status}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                            PAYMENT_COLORS[order.payment_status] ||
                            'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}
                        >
                          {PAYMENT_STATUSES.find(
                            (s) => s.value === order.payment_status
                          )?.label || order.payment_status}
                        </span>

                        {order.payment_type && (
                          <span className="inline-flex items-center rounded-lg bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500 border border-gray-100">
                            {order.payment_type}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-bold text-charcoal">
                        {order.truck?.brand} {order.truck?.model}{' '}
                        <span className="font-normal text-gray-400">
                          · {order.truck?.year}
                        </span>
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {order.customer?.name} ·{' '}
                        {order.phone || order.customer?.phone} ·{' '}
                        {new Date(order.created_at).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>

                      {pendingPayments.length > 0 && (
                        <p className="mt-1 text-xs font-semibold text-amber-600">
                          ⏳ {pendingPayments.length} bukti transfer menunggu verifikasi
                        </p>
                      )}

                      {(order.customer?.phone || order.phone) && (
                        <div className="mt-2 flex gap-2">
                          <a
                            href={whatsappUrl(
                              order.customer?.phone || order.phone,
                              `Halo ${
                                order.recipient_name ||
                                order.customer?.name ||
                                'Bapak/Ibu'
                              }, kami dari ${
                                siteConfig.company.name
                              } terkait pesanan truck ${
                                order.order_number
                              }.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.198-.198-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>

                            WhatsApp
                          </a>

                          <a
                            href={`tel:${
                              order.customer?.phone || order.phone
                            }`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50"
                          >
                            Telepon
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-extrabold text-primary text-sm">
                          {formatRupiah(order.amount)}
                        </p>

                        <p className="text-xs text-gray-400">
                          {PAYMENT_STATUSES.find(
                            (s) => s.value === order.payment_status
                          )?.label || order.payment_status}
                        </p>
                      </div>

                      <button
                        onClick={() => openEdit(order)}
                        className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100"
                      >
                        Kelola
                      </button>
                    </div>
                  </div>

                  {manualPayments.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Pembayaran manual
                      </p>

                      <div className="mt-2 space-y-2">
                        {manualPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <div>
                              <span className="font-bold capitalize text-charcoal">
                                {p.payment_method}
                              </span>

                              <span className="text-gray-400">
                                {' '}
                                · {formatRupiah(p.amount)} ·{' '}
                                {new Date(
                                  p.created_at
                                ).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              <span
                                className={`ml-2 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                                  PAYMENT_COLORS[p.status] ||
                                  'bg-gray-50 text-gray-500 border border-gray-100'
                                }`}
                              >
                                {p.status === 'paid'
                                  ? 'Terverifikasi'
                                  : p.status === 'pending'
                                    ? 'Menunggu'
                                    : p.status}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {p.proof_url && (
                                <button
                                  onClick={() =>
                                    setProofId(
                                      proofId === p.id ? null : p.id
                                    )
                                  }
                                  className="rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100"
                                >
                                  {proofId === p.id
                                    ? 'Tutup bukti'
                                    : 'Lihat bukti'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {proofId &&
                        manualPayments.some(
                          (p) => p.id === proofId && p.proof_url
                        ) && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                            {manualPayments
                              .find((p) => p.id === proofId)
                              ?.proof_url?.toLowerCase()
                              .endsWith('.pdf') ? (
                              <a
                                href={
                                  manualPayments.find(
                                    (p) => p.id === proofId
                                  ).proof_url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="block p-4 text-center text-sm font-bold text-secondary hover:underline"
                              >
                                📄 Buka PDF bukti transfer
                              </a>
                            ) : (
                              <img
                                src={
                                  manualPayments.find(
                                    (p) => p.id === proofId
                                  ).proof_url
                                }
                                alt="Bukti transfer"
                                className="max-h-96 w-full object-contain"
                              />
                            )}
                          </div>
                        )}

                      {pendingPayments.length > 0 && (
                        <p className="mt-2 text-[11px] text-gray-400">
                          Set pembayaran jadi <b>Lunas</b> untuk memverifikasi
                          bukti transfer di atas.
                        </p>
                      )}
                    </div>
                  )}

                  {editingId === order.id && (
                    <div className="mt-4 grid gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/[0.02] p-5 sm:grid-cols-2">
                      <div>
                        <label className="label-lux">
                          Status Pesanan
                        </label>

                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              status: e.target.value,
                            })
                          }
                          className="input-lux w-full"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label-lux">
                          Pembayaran
                        </label>

                        <select
                          value={draft.payment_status}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              payment_status: e.target.value,
                            })
                          }
                          className="input-lux w-full"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 sm:col-span-2">
                        <button
                          onClick={() => saveEdit(order)}
                          disabled={saving}
                          className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}



