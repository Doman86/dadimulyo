import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAvailability, createRental, fetchTrucks } from '../api/trucks';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import PaymentModal from '../components/PaymentModal';

export default function Rental() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [notes, setNotes] = useState('');
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [payable, setPayable] = useState(null); // { id, label, total } untuk popup pembayaran

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
        text: `Booking berhasil! Kode booking #${rental.id}. Silakan selesaikan pembayaran di popup berikut — status sewa otomatis dikonfirmasi setelah dibayar.`,
      });
      setDates({ start_date: '', end_date: '' });
      setNotes('');
      setAvailability(null);
      // Tawarkan pembayaran langsung (Midtrans / transfer / COD).
      setPayable({
        id: rental.id,
        label: `Sewa ${selected.brand} ${selected.model}`,
        total: rental.total_price ?? estimate?.total ?? 0,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal membuat booking.' });
    } finally {
      setSubmitting(false);
    }
  }

  const estimate = estimateTotal();

  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 -right-20 opacity-30" />
        <div className="orb orb-3 bottom-[-50px] left-10 opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">Sewa Truck</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">Sewa Truck</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">
              Sewa truck harian untuk kebutuhan usaha Anda. Pilih truck, tentukan tanggal, dan booking.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {message && (
          <Reveal>
            <div className={`mb-6 ${message.type === 'success' ? 'alert-lux-success' : 'alert-lux-error'}`}>
              {message.text}
            </div>
          </Reveal>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Daftar truck sewaan */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card-lux overflow-hidden">
                    <div className="skeleton aspect-video w-full" />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="skeleton h-5 w-2/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trucks.length === 0 ? (
              <Reveal>
                <div className="py-16 text-center">
                  <div className="text-5xl mb-4">🚛</div>
                  <p className="text-gray-500 text-lg">Belum ada truck yang disewakan.</p>
                </div>
              </Reveal>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {trucks.map((truck, i) => (
                  <Reveal key={truck.id} variant="up" delay={Math.min(i * 60, 300)}>
                    <button
                      onClick={() => selectTruck(truck)}
                      className={`card-lux overflow-hidden w-full text-left !rounded-xl transition-all duration-300 ${
                        selected?.id === truck.id
                          ? '!border-gold !shadow-[0_0_0_2px_rgba(201,162,39,0.3)]'
                          : ''
                      }`}
                    >
                      <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand relative">
                        {truck.images?.[0]?.image_url ? (
                          <img src={truck.images[0].image_url} alt={`${truck.brand} ${truck.model}`} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/10 to-sand text-5xl">🚛</div>
                        )}
                        {selected?.id === truck.id && (
                          <div className="absolute top-3 right-3">
                            <span className="badge-gold">Dipilih</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-gray-400">
                          {truck.year} · {truck.category?.name}
                        </div>
                        <h2 className="mt-1 font-bold text-charcoal">
                          {truck.brand} {truck.model}
                        </h2>
                        <div className="mt-2 text-sm font-extrabold text-primary">
                          {formatRupiah(truck.rental_price_per_day)}
                          <span className="font-normal text-gray-400"> / hari</span>
                        </div>
                      </div>
                    </button>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {/* Form booking */}
          <Reveal variant="right">
            <aside className="card-lux h-fit p-6 !rounded-2xl lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-primary">Form Booking</h2>

              {!selected ? (
                <p className="mt-3 text-sm text-gray-400">
                  Pilih salah satu truck di daftar untuk mulai booking.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="rounded-xl bg-sand p-3 text-sm">
                    <div className="font-bold text-charcoal">
                      {selected.brand} {selected.model}
                    </div>
                    <div className="text-primary font-bold">
                      {formatRupiah(selected.rental_price_per_day)} / hari
                    </div>
                  </div>

                  <div>
                    <label className="label-lux">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={dates.start_date}
                      onChange={(e) => { setDates({ ...dates, start_date: e.target.value }); setAvailability(null); }}
                      className="input-lux"
                    />
                  </div>
                  <div>
                    <label className="label-lux">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      min={dates.start_date || today}
                      value={dates.end_date}
                      onChange={(e) => { setDates({ ...dates, end_date: e.target.value }); setAvailability(null); }}
                      className="input-lux"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={checking || !dates.start_date || !dates.end_date}
                    className="w-full btn-outline-lux rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40"
                  >
                    {checking ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Memeriksa...
                      </span>
                    ) : 'Cek Ketersediaan'}
                  </button>

                  {availability && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${availability.available ? 'alert-lux-success' : 'alert-lux-error'}`}>
                      {availability.available ? 'Truck tersedia pada tanggal tersebut.' : 'Truck sudah dibooking pada rentang tanggal tersebut.'}
                    </div>
                  )}

                  {estimate && (
                    <div className="rounded-xl bg-sand px-4 py-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Durasi</span>
                        <span className="font-bold text-charcoal">{estimate.days} hari</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-extrabold text-primary">{formatRupiah(estimate.total)}</span>
                      </div>
                      {estimate.weeks > 0 && availability.rental_price_per_week && (
                        <div className="mt-1 text-xs text-gray-400">Paket mingguan digunakan untuk {estimate.weeks} minggu.</div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="label-lux">Catatan (opsional)</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Keperluan sewa, tujuan, dll."
                      className="input-lux"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !availability?.available}
                    className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-40"
                  >
                    {submitting ? 'Memproses...' : user ? 'Booking Sekarang' : 'Login untuk Booking'}
                  </button>
                </form>
              )}
            </aside>
          </Reveal>
        </div>
      </div>

      {payable && (
        <PaymentModal
          payable={payable}
          type="rental"
          onClose={() => setPayable(null)}
          onPaid={() => {
            setMessage({ type: 'success', text: 'Pembayaran sewa diterima! Booking kamu akan segera dikonfirmasi.' });
          }}
        />
      )}
    </div>
  );
}
