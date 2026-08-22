import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchTruck, submitLead, toggleWishlist } from '../api/trucks';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';

export default function TruckDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', message: '' });
  const [leadStatus, setLeadStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchTruck(id)
      .then((data) => {
        if (cancelled) return;
        setTruck(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat detail truck...</p>;
  if (notFound || !truck)
    return (
      <div className="py-20 text-center">
        <p className="text-gray-600">Truck tidak ditemukan.</p>
        <Link to="/trucks" className="mt-3 inline-block font-medium text-secondary">
          Kembali ke katalog
        </Link>
      </div>
    );

  const images = truck.images || [];
  const specs = truck.specifications || [];

  async function handleWishlist() {
    if (!user) return;
    const result = await toggleWishlist(truck.id);
    setWishlisted(result.wishlisted);
  }

  async function handleLeadSubmit(e) {
    e.preventDefault();
    setLeadStatus(null);
    try {
      await submitLead({
        truck_id: truck.id,
        name: leadForm.name || user?.name || '',
        phone: leadForm.phone || user?.phone || '',
        message: leadForm.message,
        source: 'web',
      });
      setLeadStatus({ success: true, message: 'Terima kasih! Tim sales kami akan segera menghubungi Anda.' });
      setLeadForm({ name: '', phone: '', message: '' });
    } catch {
      setLeadStatus({ success: false, message: 'Gagal mengirim. Silakan coba lagi.' });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/trucks" className="text-sm font-medium text-secondary hover:underline">
        ← Kembali ke katalog
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
            {images[activeImage]?.image_url ? (
              <img
                src={images[activeImage].image_url}
                alt={`${truck.brand} ${truck.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">🚛</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-24 overflow-hidden rounded border ${
                    i === activeImage ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-sm text-gray-500">
            {truck.year} · {truck.category?.name} · {truck.condition}
          </div>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {truck.brand} {truck.model}
          </h1>
          <div className="mt-3 text-3xl font-extrabold text-primary">
            {formatRupiah(truck.price)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {truck.is_for_rent && (
              <span className="rounded bg-accent px-2 py-1 text-xs font-semibold text-primary">
                Bisa Disewa
              </span>
            )}
            {truck.status === 'available' && (
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                Tersedia
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border p-3">
              <dt className="text-gray-500">Jarak Tempuh</dt>
              <dd className="font-semibold">{formatNumber(truck.mileage)} km</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Mesin</dt>
              <dd className="font-semibold">{truck.engine || '-'}</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Transmisi</dt>
              <dd className="font-semibold">{truck.transmission || '-'}</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Bahan Bakar</dt>
              <dd className="font-semibold">{truck.fuel_type || '-'}</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Kapasitas</dt>
              <dd className="font-semibold">{truck.capacity || '-'}</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Lokasi</dt>
              <dd className="font-semibold">{truck.location || '-'}</dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleWishlist}
              disabled={!user}
              title={user ? '' : 'Login untuk menyimpan'}
              className="rounded border border-primary px-4 py-2.5 font-semibold text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {wishlisted ? '♥ Tersimpan' : '♡ Simpan'}
            </button>
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold text-primary">Deskripsi</h2>
          <p className="mt-3 whitespace-pre-line text-gray-700">
            {truck.description || 'Belum ada deskripsi.'}
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary">Spesifikasi</h2>
          {specs.length === 0 ? (
            <p className="mt-3 text-gray-500">Belum ada spesifikasi tambahan.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.id} className="border-b">
                    <td className="py-2 text-gray-500">{spec.key}</td>
                    <td className="py-2 text-right font-medium">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Contact sales */}
      <section className="mt-10 rounded-lg bg-primary p-6 text-white">
        <h2 className="text-xl font-bold">Tertarik dengan truck ini?</h2>
        <p className="mt-1 text-gray-300">
          Isi form berikut, tim sales Dadi Mulyo akan segera menghubungi Anda.
        </p>
        {leadStatus && (
          <p
            className={`mt-3 rounded px-3 py-2 text-sm ${
              leadStatus.success ? 'bg-green-800' : 'bg-red-800'
            }`}
          >
            {leadStatus.message}
          </p>
        )}
        <form onSubmit={handleLeadSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            required
            placeholder="Nama Anda"
            value={leadForm.name || user?.name || ''}
            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
            className="rounded border border-gray-500 bg-white px-3 py-2 text-gray-900"
          />
          <input
            type="tel"
            required
            placeholder="No. HP / WA"
            value={leadForm.phone || user?.phone || ''}
            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
            className="rounded border border-gray-500 bg-white px-3 py-2 text-gray-900"
          />
          <button
            type="submit"
            className="rounded bg-secondary px-4 py-2 font-semibold hover:opacity-90"
          >
            Hubungi Sales
          </button>
          <textarea
            placeholder="Pesan (opsional)"
            value={leadForm.message}
            onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
            className="rounded border border-gray-500 bg-white px-3 py-2 text-gray-900 sm:col-span-3"
            rows={3}
          />
        </form>
      </section>
    </div>
  );
}
