import { Link, useNavigate } from 'react-router-dom';
import { BULK_THRESHOLD_KG, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';

export default function Cart() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleCheckout() {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold text-primary">Keranjang Kosong</h1>
        <p className="mt-2 text-gray-600">Belum ada produk jeruk di keranjang Anda.</p>
        <Link
          to="/oranges"
          className="mt-6 inline-block rounded bg-primary px-6 py-2.5 font-semibold text-white hover:opacity-90"
        >
          Belanja Jeruk Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Keranjang Belanja</h1>
      <p className="mt-1 text-gray-600">
        Harga grosir otomatis berlaku untuk pembelian {BULK_THRESHOLD_KG} kg atau lebih per produk.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const price = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null
              ? item.wholesale_price
              : item.price_per_kg;
            const isBulk = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null;

            return (
              <div key={item.product_id} className="flex gap-4 rounded-lg border bg-white p-4">
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded bg-gray-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🍊</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{item.name}</h2>
                      <div className="mt-1 text-sm text-gray-500">
                        {formatRupiah(item.price_per_kg)}/kg
                        {item.wholesale_price != null && (
                          <span className="ml-2">
                            · Grosir{' '}
                            <span className="font-semibold text-secondary">
                              {formatRupiah(item.wholesale_price)}/kg
                            </span>
                          </span>
                        )}
                      </div>
                      {isBulk && (
                        <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Harga grosir aktif
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatRupiah(price * item.quantity_kg)}</div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(item.quantity_kg)} kg × {formatRupiah(price)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(item.product_id, item.quantity_kg - 1)}
                        className="h-8 w-8 rounded border border-gray-300 font-bold text-gray-600 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-20 text-center text-sm font-medium">
                        {formatNumber(item.quantity_kg)} kg
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(
                            item.product_id,
                            Math.min(item.quantity_kg + 1, Number(item.stock_kg) || item.quantity_kg + 1)
                          )
                        }
                        className="h-8 w-8 rounded border border-gray-300 font-bold text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Min. order {formatNumber(item.minimum_order_kg)} kg · Stok {formatNumber(item.stock_kg)} kg
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-lg border bg-white p-5 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-primary">Ringkasan</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-600">Subtotal produk</span>
            <span className="font-semibold">{formatRupiah(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-gray-600">Ongkir</span>
            <span className="text-gray-500">Ditentukan saat checkout</span>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total sementara</span>
              <span className="text-xl font-bold text-primary">{formatRupiah(subtotal)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="mt-5 w-full rounded bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90"
          >
            {user ? 'Lanjut ke Checkout' : 'Login untuk Checkout'}
          </button>
          <Link to="/oranges" className="mt-3 block text-center text-sm font-medium text-secondary hover:underline">
            ← Lanjut belanja
          </Link>
        </aside>
      </div>
    </div>
  );
}
