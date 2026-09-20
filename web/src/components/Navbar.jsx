import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useI18n } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import siteConfig from '../config/site';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/trucks', label: t('nav.trucks') },
    { to: '/rental', label: t('nav.rental') },
    { to: '/oranges', label: t('nav.oranges') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-forest/85 shadow-[0_18px_50px_-20px_rgba(4,21,14,0.9)] backdrop-blur-xl border-b border-white/[0.07]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep font-display text-lg font-bold text-forest shadow-lg shadow-gold/30 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
            DM
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
          </span>
          <span className="font-display text-xl tracking-tight text-white">
            {siteConfig.company.name.split(' ')[0]}<span className="text-gold-gradient"> {siteConfig.company.name.split(' ')[1]}</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `link-underline text-sm font-medium tracking-wide transition-colors duration-300 ${
                  isActive ? 'active text-gold-light' : 'text-white/75 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="shrink-0" />
          <Link
            to="/cart"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-gold/60 hover:bg-gold/10"
            aria-label={t('nav.cart')}
          >
            <svg className="h-[18px] w-[18px] text-white transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {count > 0 && (
              <span
                key={count}
                className="animate-bounce-in absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold px-1 text-[10px] font-bold text-forest shadow-md"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-gold-light sm:block"
              >
                {user.name?.split(' ')[0]}
              </Link>
              {user.role?.name === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="hidden rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-light transition-all hover:bg-gold/20 sm:block"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn-lux hidden rounded-full px-5 py-2 text-sm font-semibold sm:block"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium                text-white/80 transition-colors duration-300 hover:text-gold-light sm:block"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="btn-lux hidden rounded-full px-5 py-2 text-sm font-semibold sm:block"
              >
                {t('nav.register')}
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-white/15 bg-white/5 lg:hidden"
            aria-label={t('nav.menu')}
          >
            <span className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
            <span className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-white/[0.06] bg-forest/95 backdrop-blur-xl transition-all duration-500 ease-out lg:hidden ${
          menuOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 px-6 py-5">
          {links.map((link, i) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={{ transitionDelay: `${i * 45}ms` }}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-500 ${
                  menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                } ${isActive ? 'bg-gold/10 text-gold-light' : 'text-white/80 hover:bg-white/5'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="divider-gold my-3" />
          {user ? (
            <button
              onClick={handleLogout}
              className="btn-lux w-full rounded-xl py-3 text-sm font-semibold"
            >
              {t('nav.logout')}
            </button>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link to="/login" className="flex-1 rounded-xl border border-white/20 py-3 text-center text-sm font-medium text-white">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn-lux flex-1 rounded-xl py-3 text-center text-sm font-semibold">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
