import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchOrange } from '../api/oranges';
import { useCart } from '../context/CartContext';
import { formatNumber, formatRupiah } from '../utils/format';

export default function OrangeDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchOrange(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
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

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat produk...</p>;
  if (notFound || !product)
    return (
      <div className="py-20 text-center">
        <p className="text-gray-600">Produk tidak ditemukan.</p>
        <Link to="/oranges" className="mt-3 inline-block font-medium text-secondary">
          Kembali ke katalog
        </Link>
      </div>
    );

  const images = product.images || [];
  const outOfStock = Number(product.stock_kg) <= 0;
  const minOrder = Number(product.minimum_order_kg || 1);

  function handleAddToCart(e) {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, Number(quantity));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/oranges" className="text-sm font-medium text-secondary hover:underline">
        ← Kembali ke katalog
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
            {images[activeImage]?.image_url ? (
              <img
                src={images[activeImage].image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl">🍊</div>
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{product.category?.name}</span>
            {product.grade && (
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-white">
                Grade {product.grade}
              </span>
            )}
            {outOfStock ? (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Stok Habis
              </span>
            ) : (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Stok Tersedia
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-4 rounded-lg border bg-gray-50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600">Harga eceran</span>
              <span className="text-2xl font-extrabold text-primary">
                {formatRupiah(product.price_per_kg)}
                <span className="text-sm font-normal text-gray-500"> / kg</span>
              </span>
            </div>
            {product.wholesale_price && (
              <div className="mt-1 flex items-baseline justify-between border-t border-gray-200 pt-2">
                <span className="text-sm text-gray-600">Harga grosir</span>
                <span className="text-lg font-bold text-secondary">
                  {formatRupiah(product.wholesale_price)}
                  <span className="text-sm font-normal text-gray-500"> / kg</span>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleAddToCart} className="mt-5 rounded-lg border bg-white p-4">
            <label className="block text-sm font-medium text-gray-700">
              Jumlah (kg) — min. {formatNumber(minOrder)} kg
            </label>
            <div className="mt-2 flex gap-3">
              <input
                type="number"
                required
                min={minOrder}
                max={Number(product.stock_kg)}
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-32 rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={outOfStock}
                className="flex-1 rounded bg-secondary px-4 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {added ? '✓ Ditambahkan ke Keranjang' : '🛒 Tambah ke Keranjang'}
              </button>
            </div>
            <Link
              to="/cart"
              className="mt-2 inline-block text-sm font-medium text-secondary hover:underline"
            >
              Lihat keranjang →
            </Link>
          </form>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border p-3">
              <dt className="text-gray-500">Stok</dt>
              <dd className="font-semibold">{formatNumber(product.stock_kg)} kg</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Min. Order</dt>
              <dd className="font-semibold">{formatNumber(product.minimum_order_kg)} kg</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Jadwal Panen</dt>
              <dd className="font-semibold">
                {product.harvest_date
                  ? new Date(product.harvest_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-gray-500">Lokasi Kebun</dt>
              <dd className="font-semibold">{product.farm_location || '-'}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg bg-primary p-5 text-white">
            <h2 className="font-semibold">Butuh pesanan dalam jumlah besar?</h2>
            <p className="mt-1 text-sm text-gray-300">
              Harga grosir berlaku untuk pembelian di atas minimum order. Sistem pemesanan
              online sedang disiapkan — hubungi kami untuk pesanan langsung.
            </p>
            <a
              href="tel:081234567890"
              className="mt-3 inline-block rounded bg-secondary px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Hubungi 0812-3456-7890
            </a>
          </div>
        </div>
      </div>

      {/* Description & reviews */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold text-primary">Deskripsi</h2>
          <p className="mt-3 whitespace-pre-line text-gray-700">
            {product.description || 'Belum ada deskripsi.'}
          </p>
          {product.seller && (
            <p className="mt-4 text-sm text-gray-500">
              Dijual oleh: <span className="font-medium text-gray-700">{product.seller.name}</span>
            </p>
          )}
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary">Ulasan</h2>
          {product.reviews?.length ? (
            <div className="mt-3 space-y-3">
              {product.reviews.map((review) => (
                <div key={review.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.user_name}</span>
                    <span className="text-secondary">{"★".repeat(review.rating)}</span>
                  </div>
                  {review.review && <p className="mt-1 text-gray-600">{review.review}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-gray-500">Belum ada ulasan.</p>
          )}
        </section>
      </div>
    </div>
  );
}
