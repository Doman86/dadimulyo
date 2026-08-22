import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAvailability, createRental, fetchTrucks } from '../api/trucks';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';

export default function Rental() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [notes, setNotes] = useState('');
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null); // { available, rental_price_per_day }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTrucks({ is_for_rent: 1, per_page: 50 })
      .then((result) => setTrucks(result.data))
      .catch(() => setMessage({ type: 'error', text: 'Gagal memuat daftar truck sewaan.' }))
      .finally(() => setLoading(false));
  }, []);

  function selectTruck(truck) {
    setSelected(truck);
    setAvailability(null);
    setMessage(null);
  }

  async function handleCheck() {
    if (!selected || !dates.start_date || !dates.end_date) return;
    setChecking(true);
    setAvailability(null);
    setMessage(null);
    try {
      const result = await checkAvailability(selected.id, dates.start_date, dates.end_date);
      setAvailability(result);
    } catch {
      setMessage({ type: 'error', text: 'Gagal memeriksa ketersediaan.' });
    } finally {
      setChecking(false);
    }
  }

  function estimateTotal() {
    if (!availability?.available || !dates.start_date || !dates.end_date) return null;
    const start = new Date(dates.start_date);
    const end = new Date(dates.end_date);
    const days = Math.round((end - start) / 86400000) + 1;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    const weeklyPrice = availability.rental_price_per_week;
    const total = weeklyPrice && weeks > 0
      ? weeklyPrice * weeks + availability.rental_price_per_day * remainingDays
      : availability.rental_price_per_day * days;
    return { days, weeks, remainingDays, total };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!user) {
      navigate('/login', { state: { from: '/rental' } });
      return;
    }

    setSubmitting(true);
    try {
      const rental = await createRental({
        truck_id: selected.id,
        start_date: dates.start_date,
        end_date: dates.end_date,
        notes,
      });
      setMessage({
        type: 'success',
        text: `Booking berhasil! Kode booking ${rental.id} berstatus "${rental.status}". Tim kami akan mengonfirmasi segera.`,
      });
      setDates({ start_date: '', end_date: '' });
      setNotes('');
      setAvailability(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal membuat booking.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const estimate = estimateTotal();
  const inputCls =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Sewa Truck</h1>
      <p className="mt-1 text-gray-600">
        Sewa truck harian untuk kebutuhan usaha Anda. Pilih truck, tentukan tanggal, dan booking.
      </p>

      {message && (
        <p
          className={`mt-4 rounded px-3 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Daftar truck sewaan */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-center text-gray-500">Memuat data...</p>
          ) : trucks.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada truck yang disewakan.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {trucks.map((truck) => (
                <button
                  key={truck.id}
                  onClick={() => selectTruck(truck)}
                  className={`overflow-hidden rounded-lg border bg-white text-left transition ${
                    selected?.id === truck.id
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="aspect-video w-full bg-gray-200">
                    {truck.images?.[0]?.image_url ? (
                      <img
                        src={truck.images[0].image_url}
                        alt={`${truck.brand} ${truck.model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🚛</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500">
                      {truck.year} · {truck.category?.name}
                    </div>
                    <h2 className="mt-1 font-semibold text-gray-900">
                      {truck.brand} {truck.model}
                    </h2>
                    <div className="mt-2 text-sm font-bold text-primary">
                      {formatRupiah(truck.rental_price_per_day)}
                      <span className="font-normal text-gray-500"> / hari</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form booking */}
        <aside className="lg:sticky lg:top-6 h-fit rounded-lg border bg-white p-5">
          <h2 className="text-lg font-bold text-primary">Form Booking</h2>

          {!selected ? (
            <p className="mt-3 text-sm text-gray-500">
              Pilih salah satu truck di daftar untuk mulai booking.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="rounded bg-gray-50 p-3 text-sm">
                <div className="font-semibold text-gray-900">
                  {selected.brand} {selected.model}
                </div>
                <div className="text-primary">
                  {formatRupiah(selected.rental_price_per_day)} / hari
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input
                  type="date"
                  required
                  min={today}
                  value={dates.start_date}
                  onChange={(e) => {
                    setDates({ ...dates, start_date: e.target.value });
                    setAvailability(null);
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                <input
                  type="date"
                  required
                  min={dates.start_date || today}
                  value={dates.end_date}
                  onChange={(e) => {
                    setDates({ ...dates, end_date: e.target.value });
                    setAvailability(null);
                  }}
                  className={inputCls}
                />
              </div>

              <button
                type="button"
                onClick={handleCheck}
                disabled={checking || !dates.start_date || !dates.end_date}
                className="w-full rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-40"
              >
                {checking ? 'Memeriksa...' : 'Cek Ketersediaan'}
              </button>

              {availability && (
                <div
                  className={`rounded px-3 py-2 text-sm ${
                    availability.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {availability.available
                    ? '✅ Truck tersedia pada tanggal tersebut.'
                    : '❌ Truck sudah dibooking pada rentang tanggal tersebut.'}
                </div>
              )}

              {estimate && (
                <div className="rounded bg-gray-50 px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durasi</span>
                    <span className="font-medium">{estimate.days} hari</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-primary">
                      {formatRupiah(estimate.total)}
                    </span>
                  </div>
                  {estimate.weeks > 0 && availability.rental_price_per_week && (
                    <div className="mt-1 text-xs text-gray-500">Paket mingguan digunakan untuk {estimate.weeks} minggu.</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan (opsional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keperluan sewa, tujuan, dll."
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !availability?.available}
                className="w-full rounded bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {submitting
                  ? 'Memproses...'
                  : user
                    ? 'Booking Sekarang'
                    : 'Login untuk Booking'}
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
