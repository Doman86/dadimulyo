import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

export default function Register() {
  const { register, verifyOtp, resendOtp, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
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
    const result = await register(form);
    if (result.success && result.needsOtp) {
      setPendingEmail(result.email);
      setPendingMasked(result.emailMasked);
      setInfo(result.message);
      setStep('otp');
      return;
    }
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(otp)) {
      setError('Masukkan 6 digit kode verifikasi.');
      return;
    }
    const result = await verifyOtp(pendingEmail, otp);
    if (result.success) {
      navigate('/dashboard');
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

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
                <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Daftar Akun</h1>
                <p className="mt-1 text-sm text-gray-400">Buat akun untuk mulai berbelanja</p>
              </>
            ) : (
              <>
                <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Verifikasi Email</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Kode 6 digit dikirim ke <span className="font-semibold text-secondary">{pendingMasked || pendingEmail}</span>
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
                <label className="label-lux">Nama Lengkap</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Nama lengkap Anda" className="input-lux" />
              </div>
              <div>
                <label className="label-lux">Email</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="email@contoh.com" className="input-lux" />
              </div>
              <div>
                <label className="label-lux">No. HP / WhatsApp *</label>
                <input type="tel" required value={form.phone} onChange={set('phone')} placeholder="0812-xxxx-xxxx" className="input-lux" />
              </div>
              <div>
                <label className="label-lux">Password</label>
                <input type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Min. 8 karakter" className="input-lux" />
              </div>
              <div>
                <label className="label-lux">Konfirmasi Password</label>
                <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Ulangi password" className="input-lux" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                    Memproses...
                  </span>
                ) : 'Daftar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="label-lux">Kode Verifikasi</label>
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
                    Memverifikasi...
                  </span>
                ) : 'Verifikasi & Masuk'}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || loading}
                className="w-full text-center text-sm font-semibold text-secondary hover:underline disabled:text-gray-400 disabled:hover:no-underline"
              >
                {resendIn > 0 ? `Kirim ulang kode (${resendIn} detik)` : 'Kirim ulang kode'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Tidak menerima email? Pastikan alamat email benar, cek folder Spam, atau kirim ulang kode.
              </p>
            </form>
          )}

          {step === 'credentials' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-bold text-secondary hover:underline">Masuk di sini</Link>
              </p>
            </div>
          )}

          <div className="divider-gold my-5" />

          <Link to="/" className="block text-center text-xs text-gray-400 hover:text-primary transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
