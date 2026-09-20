import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchOrange } from '../api/oranges';
import { useCart } from '../context/CartContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';
import siteConfig from '../config/site';

export default function OrangeDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t, dateLocale } = useI18n();
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
      .then((data) => { if (!cancelled) setProduct(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <div className="py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="mt-4 text-gray-500">{t('oranges.loading')}</p>
    </div>
  );
  if (notFound || !product) return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">🍊</div>
      <p className="text-gray-600 text-lg">{t('oranges.not_found')}</p>
      <Link to="/oranges" className="mt-4 inline-flex btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">            {t('common.back_to_catalog')}
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
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link to="/oranges" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            {t('common.back_to_catalog')}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Gallery */}
          <Reveal variant="left" className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl bg-sand border border-gray-100 shadow-lg relative">
              <div className="aspect-video w-full">
                {images[activeImage]?.image_url ? (
                  <img src={images[activeImage].image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/5 to-sand text-8xl">🍊</div>
                )}
              </div>
              {product.grade && (
                <div className="absolute top-4 right-4">
                  <span className="badge-gold text-sm">Grade {product.grade}</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-18 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      i === activeImage ? 'border-gold shadow-lg shadow-gold/20 scale-105' : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Reveal>

          {/* Info */}
          <Reveal variant="right" className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{product.category?.name}</span>
                {outOfStock ? (
                  <span className="badge-orange">{t('oranges.out_of_stock')}</span>
                ) : (
                  <span className="badge-green">{t('oranges.in_stock')}</span>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-charcoal md:text-4xl">
                {product.name}
              </h1>

              {/* Pricing Card */}
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-sand to-cream p-5 border border-gold/10">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-500">{t('oranges.retail_price')}</span>
                  <span className="text-2xl font-extrabold text-primary">
                    {formatRupiah(product.price_per_kg)}
                    <span className="text-sm font-normal text-gray-400"> {t('oranges.per_kg')}</span>
                  </span>
                </div>
                {product.wholesale_price && (
                  <div className="mt-2 flex items-baseline justify-between border-t border-gold/10 pt-2">
                    <span className="text-sm text-gray-500">{t('oranges.wholesale_price')}</span>
                    <span className="text-lg font-bold text-secondary">
                      {formatRupiah(product.wholesale_price)}
                      <span className="text-sm font-normal text-gray-400"> {t('oranges.per_kg')}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Add to cart */}
              <form onSubmit={handleAddToCart} className="mt-5 card-lux p-5 !rounded-2xl">
                <label className="label-lux">
                  {t('oranges.quantity_min', { min: formatNumber(minOrder) })}
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
                    className="input-lux w-32"
                  />
                  <button
                    type="submit"
                    disabled={outOfStock}
                    className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ${
                      added
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'btn-lux'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {added ? t('oranges.added') : `+ ${t('common.add_to_cart')}`}
                  </button>
                </div>
                <Link to="/cart" className="mt-3 inline-block text-sm font-medium text-secondary hover:underline">
                  {t('oranges.view_cart')}
                </Link>
              </form>

              {/* Product details */}
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: t('oranges.stock_label'), value: `${formatNumber(product.stock_kg)} kg` },
                  { label: t('oranges.min_order'), value: `${formatNumber(product.minimum_order_kg)} kg` },
                  {
                    label: t('oranges.harvest_date'),
                    value: product.harvest_date
                      ? new Date(product.harvest_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                  },
                  { label: t('oranges.farm_location'), value: product.farm_location || '-' },
                ].map((item) => (
                  <div key={item.label} className="card-lux p-3 !rounded-xl hover:transform-none">
                    <dt className="text-xs text-gray-400 font-medium">{item.label}</dt>
                    <dd className="mt-0.5 font-bold text-charcoal">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Bulk order CTA */}
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary-dark to-forest p-5 text-white">
                <h3 className="font-semibold">{t('oranges.bulk_title')}</h3>
                <p className="mt-1 text-sm text-white/50">
                  {t('oranges.bulk_desc')}
                </p>
                <a href={`tel:${siteConfig.contact.phoneDigits}`} className="mt-3 inline-flex btn-lux rounded-full px-5 py-2 text-xs font-bold">
                  {t('oranges.contact_at', { phone: siteConfig.contact.phone })}
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Description & reviews */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Reveal variant="left">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-xl font-bold text-primary">{t('common.description')}</h2>
              <p className="mt-3 whitespace-pre-line text-gray-600 leading-relaxed">
                {product.description || t('common.no_description')}
              </p>
              {product.seller && (
                <p className="mt-4 text-sm text-gray-400">
                  {t('oranges.sold_by')} <span className="font-semibold text-charcoal">{product.seller.name}</span>
                </p>
              )}
            </section>
          </Reveal>
          <Reveal variant="right">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-xl font-bold text-primary">{t('oranges.reviews')}</h2>
              {product.reviews?.length ? (
                <div className="mt-3 space-y-3">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl bg-cream p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal">{review.user_name}</span>
                        <span className="text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                      </div>
                      {review.review && <p className="mt-2 text-sm text-gray-600">{review.review}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-gray-400">{t('oranges.no_reviews')}</p>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
