import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlists, toggleWishlist } from '../api/trucks';
import { formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';

export default function Wishlist() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlists()
      .then((result) => setTrucks(Array.isArray(result) ? result : result.data || []))
      .catch(() => setError('Gagal memuat wishlist.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(truckId) {
    try { await toggleWishlist(truckId); setTrucks((prev) => prev.filter((t) => t.id !== truckId)); } catch { setError('Gagal menghapus dari wishlist.'); }
  }

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">Wishlist Truck</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">Truck yang Anda simpan.</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error && <Reveal><div className="mb-6 alert-lux-error">{error}</div></Reveal>}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="card-lux overflow-hidden"><div className="skeleton aspect-video w-full" /><div className="p-5 space-y-3"><div className="skeleton h-3 w-1/3 rounded" /><div className="skeleton h-5 w-2/3 rounded" /></div></div>)}
          </div>
        ) : trucks.length === 0 ? (
          <Reveal variant="zoom">
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand text-gray-300">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              </div>
              <p className="mt-4 text-gray-500 text-lg">Belum ada truck tersimpan.</p>
              <Link to="/trucks" className="mt-4 inline-flex btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">Jelajahi katalog truck</Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck, i) => (
              <Reveal key={truck.id} variant="up" delay={Math.min(i * 80, 400)}>
                <div className="card-lux card-img-zoom overflow-hidden">
                  <Link to={`/trucks/${truck.id}`}>
                    <div className="card-img-zoom aspect-video w-full overflow-hidden bg-sand relative">
                      {truck.images?.[0]?.image_url ? (
                        <img src={truck.images[0].image_url} alt={`${truck.brand} ${truck.model}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/10 to-sand text-5xl">🚛</div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className="glass-dark rounded-full px-3.5 py-1.5 text-xs font-bold text-gold-light backdrop-blur-md">{formatRupiah(truck.price)}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-400">{truck.year} · {truck.category?.name || 'Truck'}</div>
                        <h2 className="mt-1 font-bold text-charcoal">{truck.brand} {truck.model}</h2>
                        <div className="mt-1 font-extrabold text-primary">{formatRupiah(truck.price)}</div>
                      </div>
                      <button onClick={() => handleRemove(truck.id)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors" title="Hapus dari wishlist">
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
