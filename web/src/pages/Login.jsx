import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Reveal from '../components/Reveal';
import siteConfig from '../config/site';

export default function Login() {
  const { login, verifyOtp, resendOtp, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('credentials');
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingMasked, setPendingMasked] = useState('');
  const [resendIn, setResendIn] = useState(60);

  // Hitung mundur untuk tombol kirim ulang kode
  useEffect(() => {
    if (step !== 'otp') return;
    setResendIn(60);
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step, info]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const result = await login(form.email, form.password);
    if (result.success && result.needsOtp) {
      setPendingEmail(result.email);
      setPendingMasked(result.emailMasked);
      setInfo(result.message);
      setStep('otp');
      return;
    }
    if (result.success) {
      navigate(location.state?.from || '/dashboard');
    } else {
      setError(result.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(otp)) {
      setError(t('auth.otp_invalid'));
      return;
    }
    const result = await verifyOtp(pendingEmail, otp);
    if (result.success) {
      navigate(location.state?.from || '/dashboard');
    } else {
      setError(result.message);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setError(null);
    const result = await resendOtp(pendingEmail);
    if (result.success) {
      if (result.emailMasked) setPendingMasked(result.emailMasked);
      setInfo(result.message);
      setOtp('');
      setResendIn(60);
    } else {
      setError(result.message);
    }
  }

  function backToCredentials() {
    setStep('credentials');
    setError(null);
    setInfo(null);
    setOtp('');
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4 py-16">
      <Reveal variant="zoom" className="w-full max-w-md">
        <div className="card-lux p-8 !rounded-2xl">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep font-display text-lg font-bold text-forest shadow-lg shadow-gold/30">
                DM
              </span>
            </Link>
            {step === 'credentials' ? (
              <>
                <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">{t('auth.login_title')}</h1>
                <p className="mt-1 text-sm text-gray-400">{t('auth.login_desc', { name: siteConfig.company.name })}</p>
              </>
            ) : (
              <>
                <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">{t('auth.verify_title')}</h1>
                <p className="mt-1 text-sm text-gray-400">
                  {t('auth.verify_desc', { email: <span className="font-semibold text-secondary">{pendingMasked || pendingEmail}</span> })}
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 alert-lux-error">{error}</div>
          )}

          {info && step === 'otp' && (
            <div className="mt-4 alert-lux-success">{info}</div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label-lux">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('auth.email_placeholder')}
                  className="input-lux"
                />
              </div>
              <div>
                <label className="label-lux">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.password_placeholder')}
                  className="input-lux"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                    {t('common.processing')}
                  </span>
                ) : t('auth.login_title')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="label-lux">{t('auth.otp_code')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoComplete="one-time-code"
                  className="input-lux text-center text-2xl font-bold tracking-[0.5em]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                    {t('auth.verifying')}
                  </span>
                ) : t('auth.verify_login')}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || loading}
                className="w-full text-center text-sm font-semibold text-secondary hover:underline disabled:text-gray-400 disabled:hover:no-underline"
              >
                {resendIn > 0 ? t('auth.resend_in', { seconds: resendIn }) : t('auth.resend')}
              </button>
              <p className="text-center text-xs text-gray-400">
                {t('auth.otp_help')}
              </p>
              <button
                type="button"
                onClick={backToCredentials}
                className="w-full text-center text-xs text-gray-400 hover:text-primary transition-colors"
              >
                {t('auth.change_credentials')}
              </button>
            </form>
          )}

          {step === 'credentials' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {t('auth.no_account')}{' '}
                <Link to="/register" className="font-bold text-secondary hover:underline">{t('auth.register_here')}</Link>
              </p>
            </div>
          )}

          <div className="divider-gold my-5" />

          <Link to="/" className="block text-center text-xs text-gray-400 hover:text-primary transition-colors">
            {t('auth.back_home')}
          </Link>
        </div>
      </Reveal>
    </div>
  );
}