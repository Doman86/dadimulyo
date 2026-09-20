import { Link, useNavigate } from 'react-router-dom';
import { BULK_THRESHOLD_KG, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';

export default function Cart() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
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
        <Reveal variant="zoom">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sand text-gray-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-charcoal">{t('cart.empty_title')}</h1>
          <p className="mt-2 text-gray-400">{t('cart.empty_desc')}</p>
          <Link to="/oranges" className="mt-6 inline-flex btn-lux rounded-full px-7 py-3 text-sm font-bold">
            {t('cart.shop_now')}
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero !py-12">
        <div className="relative z-10">            <Reveal>
            <h1 className="font-display text-3xl font-extrabold text-white">{t('cart.title')}</h1>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <p className="mt-2 text-white/50 text-sm">
              {t('cart.bulk_note', { threshold: BULK_THRESHOLD_KG })}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item, i) => {
              const price = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null
                ? item.wholesale_price
                : item.price_per_kg;
              const isBulk = item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null;

              return (
                <Reveal key={item.product_id} variant="up" delay={i * 60}>
                  <div className="card-lux flex gap-4 p-4 !rounded-xl">
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-sand">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🍊</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-charcoal truncate">{item.name}</h2>
                          <div className="mt-1 text-sm text-gray-400">
                            {formatRupiah(item.price_per_kg)}/kg
                            {item.wholesale_price != null && (
                              <span className="ml-2">· {t('oranges.wholesale')} <span className="font-bold text-secondary">{formatRupiah(item.wholesale_price)}/kg</span></span>
                            )}
                          </div>
                          {isBulk && <span className="mt-1 inline-block badge-green">{t('cart.wholesale_active')}</span>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-primary">{formatRupiah(price * item.quantity_kg)}</div>
                          <div className="text-xs text-gray-400">
                            {formatNumber(item.quantity_kg)} kg × {formatRupiah(price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQuantity(item.product_id, item.quantity_kg - 1)} className="h-8 w-8 rounded-lg border border-gray-200 font-bold text-gray-500 hover:bg-sand transition-colors">−</button>
                          <span className="w-20 text-center text-sm font-bold">{formatNumber(item.quantity_kg)} kg</span>
                          <button onClick={() => setQuantity(item.product_id, Math.min(item.quantity_kg + 1, Number(item.stock_kg) || item.quantity_kg + 1))} className="h-8 w-8 rounded-lg border border-gray-200 font-bold text-gray-500 hover:bg-sand transition-colors">+</button>
                        </div>
                        <button onClick={() => removeItem(item.product_id)} className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline transition-colors">
                          {t('cart.remove')}
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-gray-300">
                        {t('cart.min_order_stock', {
                          min: formatNumber(item.minimum_order_kg),
                          stock: formatNumber(item.stock_kg),
                        })}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Summary */}
          <Reveal variant="right">
            <aside className="card-lux h-fit p-6 !rounded-2xl lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-primary">{t('cart.summary')}</h2>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('cart.product_subtotal')}</span>
                  <span className="font-bold text-charcoal">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('common.shipping')}</span>
                  <span className="text-gray-400 text-xs">{t('cart.shipping_note')}</span>
                </div>
              </div>
              <div className="divider-gold my-4" />
              <div className="flex justify-between">
                <span className="font-bold text-charcoal">{t('cart.temporary_total')}</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(subtotal)}</span>
              </div>
              <button onClick={handleCheckout} className="mt-5 w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold">
                {user ? t('cart.continue_checkout') : t('cart.login_to_checkout')}
              </button>
              <Link to="/oranges" className="mt-3 block text-center text-sm font-medium text-secondary hover:underline">
                {t('cart.continue_shopping')}
              </Link>
            </aside>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
