import { useI18n } from '../i18n';

const OPTIONS = [
  { code: 'id', flag: '🇮🇩', label: 'ID' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
];

/**
 * Language switcher compact: 🌐 ID | EN
 * Dipakai di Navbar & Footer (background gelap). Gaya mengikuti pill navbar yang ada.
 */
export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language.switch')}
      title={t('language.switch')}
      className={`flex items-center gap-0.5 rounded-full border border-white/15 bg-white/5 px-1.5 py-1 backdrop-blur-md ${className}`}
    >
      <svg
        className="ml-0.5 h-3.5 w-3.5 text-white/60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9s-1.4 6.4-3.9 9c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3z" />
      </svg>
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLocale(opt.code)}
          aria-pressed={locale === opt.code}
          aria-label={opt.code === 'id' ? t('language.indonesia') : t('language.english')}
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-tight transition-all duration-300 ${
            locale === opt.code
              ? 'bg-gradient-to-br from-gold-light to-gold text-forest shadow-sm shadow-gold/40'
              : 'text-white/60 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
