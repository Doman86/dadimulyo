import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Reveal from '../components/Reveal';
import siteConfig from '../config/site';

export default function Profile() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();
  const [message, setMessage] = useState(null);

  if (!user) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-gray-500">{t('profile.login_required')}</p>
      <Link to="/login" className="mt-3 inline-flex btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">Login</Link>
    </div>
  );

  return (
    <div>
      <section className="page-hero !py-12">
        <div className="relative z-10">
          <Reveal><h1 className="font-display text-3xl font-extrabold text-white">{t('profile.title')}</h1></Reveal>
          <Reveal variant="up" delay={100}><p className="mt-2 text-white/50 text-sm">{t('profile.desc', { name: siteConfig.company.name })}</p></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {message && <Reveal><div className={`mb-6 ${message.type === 'success' ? 'alert-lux-success' : 'alert-lux-error'}`}>{message.text}</div></Reveal>}

        <Reveal>
          <div className="card-lux p-6 !rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep text-2xl font-bold text-forest shadow-lg shadow-gold/30">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal">{user.name}</h2>
                <p className="text-sm text-gray-400">
                  {user.role?.name ? user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1).replace('_', ' ') : t('profile.customer')}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
                <dt className="font-medium text-gray-400 text-xs uppercase tracking-wide">{t('profile.email')}</dt>
                <dd className="text-charcoal font-medium">{user.email}</dd>
              </div>
              {user.phone && (
                <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
                  <dt className="font-medium text-gray-400 text-xs uppercase tracking-wide">{t('profile.phone')}</dt>
                  <dd className="text-charcoal font-medium">{user.phone}</dd>
                </div>
              )}
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
                <dt className="font-medium text-gray-400 text-xs uppercase tracking-wide">{t('profile.status')}</dt>
                <dd><span className="badge-green">{user.status || 'active'}</span></dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-medium text-gray-400 text-xs uppercase tracking-wide">{t('profile.registered_since')}</dt>
                <dd className="text-charcoal font-medium">
                  {new Date(user.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-6 flex gap-3">
            <Link to="/orders" className="btn-outline-lux rounded-xl px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              {t('profile.order_history')}
            </Link>
            <Link to="/rental" className="btn-outline-lux rounded-xl px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>
              {t('profile.rent_truck')}
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
