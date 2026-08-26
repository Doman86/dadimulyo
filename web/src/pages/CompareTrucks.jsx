import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';

const fields = [
  ['brand', 'Merek'], ['model', 'Model'], ['year', 'Tahun'], ['price', 'Harga'],
  ['mileage', 'Kilometer'], ['engine', 'Mesin'], ['capacity', 'Kapasitas'],
  ['transmission', 'Transmisi'], ['fuel_type', 'Bahan bakar'], ['condition', 'Kondisi'],
  ['location', 'Lokasi'],
];

export default function CompareTrucks() {
  let trucks = [];
  try { trucks = JSON.parse(localStorage.getItem('compare_trucks') || '[]'); } catch { trucks = []; }

  function clear() { localStorage.removeItem('compare_trucks'); window.location.reload(); }

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">Bandingkan Truck</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">Bandingkan spesifikasi truck sebelum menghubungi sales.</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div />
          {trucks.length > 0 && (
            <button onClick={clear} className="btn-outline-lux rounded-full px-5 py-2 text-xs font-bold">Hapus semua</button>
          )}
        </div>

        {trucks.length < 2 ? (
          <Reveal variant="zoom">
            <div className="card-lux p-8 text-center !rounded-2xl">
              <div className="text-5xl mb-4">🚛</div>
              <p className="text-gray-500 text-lg">Pilih minimal dua truck dari katalog untuk dibandingkan.</p>
              <Link to="/trucks" className="mt-4 inline-flex btn-lux rounded-full px-6 py-2.5 text-sm font-bold">Kembali ke katalog</Link>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="card-lux overflow-x-auto !rounded-2xl">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gradient-to-r from-forest to-primary-dark">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gold-light/80">Spesifikasi</th>
                    {trucks.map((truck) => (
                      <th key={truck.id} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">{truck.brand} {truck.model}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([key, label], i) => (
                    <tr key={key} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-cream' : 'bg-white'}`}>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</th>
                      {trucks.map((truck) => (
                        <td key={truck.id} className="px-5 py-3 font-bold text-charcoal">
                          {key === 'price' ? <span className="text-primary">{formatRupiah(truck[key])}</span> : truck[key] || <span className="text-gray-300">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
