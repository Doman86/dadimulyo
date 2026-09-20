import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchTruck, submitLead, toggleWishlist } from '../api/trucks';
import { createTruckOrder } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatRupiah } from '../utils/format';
import Reveal from '../components/Reveal';
import PaymentModal from '../components/PaymentModal';
import { useI18n } from '../i18n';
import siteConfig from '../config/site';

export default function TruckDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', message: '' });
  const [leadStatus, setLeadStatus] = useState(null);
  const [buyForm, setBuyForm] = useState({ recipient_name: '', phone: '', notes: '' });
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [payable, setPayable] = useState(null); // { id, label, total } untuk popup pembayaran

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchTruck(id)
      .then((data) => { if (!cancelled) setTruck(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <div className="py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="mt-4 text-gray-500">{t('trucks.loading_detail')}</p>
    </div>
  );
  if (notFound || !truck) return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">🚛</div>
      <p className="text-gray-600 text-lg">{t('trucks.not_found')}</p>
      <Link to="/trucks" className="mt-4 inline-flex btn-outline-lux rounded-full px-6 py-2.5 text-sm font-bold">
        {t('common.back_to_catalog')}
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
      setLeadStatus({ success: true, message: t('trucks.lead_success') });
      setLeadForm({ name: '', phone: '', message: '' });
    } catch {
      setLeadStatus({ success: false, message: t('trucks.lead_failed') });
    }
  }

  async function handleBuySubmit(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/trucks/${id}` } });
      return;
    }
    setBuyError(null);
    setBuying(true);
    try {
      const order = await createTruckOrder({
        truck_id: truck.id,
        recipient_name: buyForm.recipient_name || user?.name || '',
        phone: buyForm.phone || user?.phone || '',
        notes: buyForm.notes || undefined,
      });
      setPayable({
        id: order.id,
        label: t('trucks.buy_label', { brand: truck.brand, model: truck.model }),
        order_number: order.order_number,
        total: order.amount ?? truck.price,
      });
    } catch (err) {
      setBuyError(err.response?.data?.message || t('trucks.order_failed'));
    } finally {
      setBuying(false);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link to="/trucks" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            {t('common.back_to_catalog')}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Gallery */}
          <Reveal variant="left" className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl bg-sand border border-gray-100 shadow-lg">
              <div className="aspect-video w-full">
                {images[activeImage]?.image_url ? (
                  <img src={images[activeImage].image_url} alt={`${truck.brand} ${truck.model}`} className="h-full w-full object-cover transition-transform duration-700" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest/5 to-sand text-8xl">🚛</div>
                )}
              </div>
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
                <span>{truck.year}</span>
                <span>·</span>
                <span>{truck.category?.name}</span>
                <span>·</span>
                <span className={truck.condition === 'baru' ? 'badge-green' : 'badge-orange'}>{truck.condition === 'baru' ? t('trucks.condition_new') : t('trucks.condition_used')}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-charcoal md:text-4xl">
                {truck.brand} {truck.model}
              </h1>
              <div className="mt-4 text-3xl font-extrabold text-primary">
                {formatRupiah(truck.price)}
              </div>

              {truck.is_for_sale && truck.status === 'available' && (
                <form onSubmit={handleBuySubmit} className="mt-5 space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-4">
                  <div className="font-display text-sm font-bold text-charcoal">{t('trucks.buy_now_title')}</div>
                  {buyError && <div className="alert-lux-error !text-xs">{buyError}</div>}
                  <input
                    required
                    placeholder={t('trucks.recipient_name')}
                    value={buyForm.recipient_name || user?.name || ''}
                    onChange={(e) => setBuyForm({ ...buyForm, recipient_name: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <input
                    required
                    type="tel"
                    placeholder={t('trucks.phone_wa')}
                    value={buyForm.phone || user?.phone || ''}
                    onChange={(e) => setBuyForm({ ...buyForm, phone: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <textarea
                    rows={2}
                    placeholder={t('trucks.notes_optional')}
                    value={buyForm.notes}
                    onChange={(e) => setBuyForm({ ...buyForm, notes: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <button type="submit" disabled={buying} className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                    {buying ? t('common.processing') : t('trucks.create_order_pay')}
                  </button>
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    {t('trucks.order_note')}
                  </p>
                </form>
              )}

              {truck.is_for_sale && truck.status === 'available' && (
                <form onSubmit={handleBuySubmit} className="mt-5 space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-4">
                  <div className="font-display text-sm font-bold text-charcoal">{t('trucks.buy_now_title')}</div>
                  {buyError && <div className="alert-lux-error !text-xs">{buyError}</div>}
                  <input
                    required
                    placeholder={t('trucks.recipient_name')}
                    value={buyForm.recipient_name || user?.name || ''}
                    onChange={(e) => setBuyForm({ ...buyForm, recipient_name: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <input
                    required
                    type="tel"
                    placeholder={t('trucks.phone_wa')}
                    value={buyForm.phone || user?.phone || ''}
                    onChange={(e) => setBuyForm({ ...buyForm, phone: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <textarea
                    rows={2}
                    placeholder={t('trucks.notes_optional')}
                    value={buyForm.notes}
                    onChange={(e) => setBuyForm({ ...buyForm, notes: e.target.value })}
                    className="input-lux !py-2.5 text-sm"
                  />
                  <button type="submit" disabled={buying} className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                    {buying ? t('common.processing') : t('trucks.create_order_pay')}
                  </button>
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    {t('trucks.order_note')}
                  </p>
                </form>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {truck.is_for_rent && (
                  <span className="badge-lux text-[0.65rem]">{t('trucks.rentable')}</span>
                )}
                {truck.status === 'available' && (
                  <span className="badge-green">{t('trucks.available')}</span>
                )}
              </div>

              {/* Specs Grid */}
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: t('trucks.mileage'), value: `${formatNumber(truck.mileage)} km` },
                  { label: t('trucks.engine'), value: truck.engine || '-' },
                  { label: t('trucks.transmission'), value: truck.transmission || '-' },
                  { label: t('trucks.fuel'), value: truck.fuel_type || '-' },
                  { label: t('trucks.capacity'), value: truck.capacity || '-' },
                  { label: t('trucks.location'), value: truck.location || '-' },
                ].map((item) => (
                  <div key={item.label} className="card-lux p-3 !rounded-xl hover:transform-none">
                    <dt className="text-xs text-gray-400 font-medium">{item.label}</dt>
                    <dd className="mt-0.5 font-bold text-charcoal">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleWishlist}
                  disabled={!user}
                  title={user ? '' : t('trucks.login_to_save')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                    wishlisted
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'btn-outline-lux'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {wishlisted ? t('trucks.saved') : t('trucks.save_wishlist')}
                </button>
                {truck.is_for_rent && (
                  <Link to="/rental" className="flex-1 btn-dark-lux rounded-xl px-4 py-3 text-center text-sm font-bold">
                    {t('trucks.rent_truck')}
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Description & specs */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Reveal variant="left">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-xl font-bold text-primary">{t('common.description')}</h2>
              <p className="mt-3 whitespace-pre-line text-gray-600 leading-relaxed">
                {truck.description || t('common.no_description')}
              </p>
            </section>
          </Reveal>
          <Reveal variant="right">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-xl font-bold text-primary">{t('trucks.specs')}</h2>
              {specs.length === 0 ? (
                <p className="mt-3 text-gray-400">{t('trucks.no_specs')}</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {specs.map((spec) => (
                      <tr key={spec.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 text-gray-400 font-medium">{spec.key}</td>
                        <td className="py-3 text-right font-bold text-charcoal">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </Reveal>
        </div>

        {/* Contact sales */}
        <Reveal>
          <section className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-forest to-pine p-8 text-white">
            <div className="orb orb-1 -top-20 -right-20 !w-60 !h-60 opacity-40" />
            <div className="hero-grid-bg absolute inset-0" />
            <div className="noise-overlay absolute inset-0" />
            <div className="relative z-10">
              <h2 className="font-display text-2xl font-bold">{t('trucks.interested')}</h2>
              <p className="mt-1 text-white/50">
                {t('trucks.interested_desc', { name: siteConfig.company.name })}
              </p>
              {leadStatus && (
                <p className={`mt-3 ${leadStatus.success ? 'alert-lux-success' : 'alert-lux-error'}`}>
                  {leadStatus.message}
                </p>
              )}
              <form onSubmit={handleLeadSubmit} className="mt-5 grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  placeholder={t('trucks.your_name')}
                  value={leadForm.name || user?.name || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="glass rounded-xl border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <input
                  type="tel"
                  required
                  placeholder={t('trucks.phone_wa')}
                  value={leadForm.phone || user?.phone || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  className="glass rounded-xl border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <button type="submit" className="btn-lux rounded-xl px-6 py-3 text-sm font-bold">
                  {t('trucks.contact_sales')}
                </button>
                <textarea
                  placeholder={t('trucks.message_optional')}
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  className="glass rounded-xl border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 sm:col-span-3"
                  rows={3}
                />
              </form>
            </div>
          </section>
        </Reveal>
      </div>

      {payable && (
        <PaymentModal
          payable={payable}
          type="truck_order"
          onClose={() => setPayable(null)}
          onPaid={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
}
