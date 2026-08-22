import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrucks } from '../api/trucks';
import { fetchOranges } from '../api/oranges';
import { formatRupiah } from '../utils/format';

export default function Home() {
  const [trucks, setTrucks] = useState([]);
  const [oranges, setOranges] = useState([]);

  useEffect(() => {
    fetchTrucks({ per_page: 6, sort: 'newest' })
      .then((result) => setTrucks(result.data || []))
      .catch(() => {});
    fetchOranges({ per_page: 6, in_stock: 1 })
      .then((result) => setOranges(result.data || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Showroom Truck &amp; Jeruk Segar dari Malang
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            Dadi Mulyo melayani penjualan dan penyewaan truck serta marketplace jeruk berkualitas
            dari Wagir, Kabupaten Malang.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/trucks"
              className="rounded bg-secondary px-6 py-3 font-semibold hover:opacity-90"
            >
              Lihat Truck
            </Link>
            <Link
              to="/oranges"
              className="rounded border border-white px-6 py-3 font-semibold hover:bg-white hover:text-primary-dark"
            >
              Beli Jeruk
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Trucks */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Truck Terbaru</h2>
          <Link to="/trucks" className="text-sm font-medium text-secondary hover:underline">
            Lihat semua →
          </Link>
        </div>
        {trucks.length === 0 ? (
          <p className="mt-4 text-gray-500">Memuat data truck...</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <Link
                key={truck.id}
                to={`/trucks/${truck.id}`}
                className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
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
                    {truck.year} · {truck.category?.name || 'Truck'}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary">
                    {truck.brand} {truck.model}
                  </h3>
                  <div className="mt-2 font-bold text-primary">{formatRupiah(truck.price)}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {truck.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Orange Products */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">Jeruk Pilihan</h2>
            <Link to="/oranges" className="text-sm font-medium text-secondary hover:underline">
              Lihat semua →
            </Link>
          </div>
          {oranges.length === 0 ? (
            <p className="mt-4 text-gray-500">Memuat produk jeruk...</p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {oranges.map((product) => (
                <Link
                  key={product.id}
                  to={`/oranges/${product.id}`}
                  className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-video w-full bg-gray-200">
                    {product.images?.[0]?.image_url ? (
                      <img
                        src={product.images[0].image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🍊</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{product.category?.name}</span>
                      {product.grade && (
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-white">
                          Grade {product.grade}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary">
                      {product.name}
                    </h3>
                    <div className="mt-2 font-bold text-primary">
                      {formatRupiah(product.price_per_kg)}
                      <span className="text-xs font-normal text-gray-500"> / kg</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Stok {product.stock_kg} kg
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Dadi Mulyo */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-primary">Kenapa Dadi Mulyo?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 text-center">
            <div className="text-4xl">🚛</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">Truck Siap Jual &amp; Sewa</h3>
            <p className="mt-2 text-sm text-gray-600">
              Pilihan truck lengkap dengan spesifikasi detail dan harga transparan.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 text-center">
            <div className="text-4xl">🍊</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">Jeruk dari Kebun</h3>
            <p className="mt-2 text-sm text-gray-600">
              Jeruk segar langsung dari kebun Wagir, Malang. Harga grosir tersedia.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 text-center">
            <div className="text-4xl">🚛</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">Pengiriman Terpercaya</h3>
            <p className="mt-2 text-sm text-gray-600">
              Pengiriman dengan truck sendiri untuk pesanan jeruk Anda.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold">Siap Berbelanja?</h2>
          <p className="mt-3 text-gray-300">
            Jelajahi katalog truck dan jeruk kami, atau hubungi kami untuk informasi lebih lanjut.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/trucks"
              className="rounded bg-secondary px-6 py-3 font-semibold hover:opacity-90"
            >
              Lihat Truck
            </Link>
            <Link
              to="/oranges"
              className="rounded border border-white px-6 py-3 font-semibold hover:bg-white hover:text-primary-dark"
            >
              Beli Jeruk
            </Link>
            <Link
              to="/contact"
              className="rounded border border-white px-6 py-3 font-semibold hover:bg-white hover:text-primary-dark"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
