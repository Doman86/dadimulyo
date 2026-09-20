import { useEffect, useState } from 'react';
import { createMidtransTransaction, submitPayment } from '../api/payments';
import { formatRupiah } from '../utils/format';
import { useI18n } from '../i18n';

/**
 * Memuat script Snap Midtrans (snap.js) sekali saja.
 * Sandbox vs production ditentukan dari response backend (is_production).
 */
function loadSnapScript(isProduction, clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve(window.snap);
    const existing = document.querySelector('script[data-midtrans-snap]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap));
      existing.addEventListener('error', reject);
      return;
    }
    const src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    const script = document.createElement('script');
    script.src = src;
    if (clientKey) script.setAttribute('data-client-key', clientKey);
    script.setAttribute('data-midtrans-snap', 'true');
    script.onload = () => resolve(window.snap);
    // Marker tanpa teks — pesan user-facing diterjemahkan di pemanggil via t('payment.snap_load_failed').
    script.onerror = () => reject(new Error('snap_load_failed'));
    document.body.appendChild(script);
  });
}

// Metode pembayaran — label memakai translation key agar bisa diterjemahkan.
const METHODS = [
  {
    id: 'midtrans',
    titleKey: 'payment.midtrans',
    descKey: 'payment.midtrans_desc',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    badgeKey: 'payment.recommended',
  },
  {
    id: 'transfer',
    titleKey: 'payment.transfer',
    descKey: 'payment.transfer_desc',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    id: 'cod',
    titleKey: 'payment.cod',
    descKey: 'payment.cod_desc',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    id: 'face_to_face',
    titleKey: 'payment.face_to_face',
    descKey: 'payment.face_to_face_desc',
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3',
  },
];

/**
 * Modal pembayaran serbaguna untuk semua jenis transaksi.
 *
 * @param {object}   props.payable  Entitas yang dibayar: { id, order_number|label, total }
 * @param {'order'|'rental'|'truck_order'} props.type  Jenis transaksi — menentukan endpoint API
 * @param {Function} props.onClose  Tutup modal
 * @param {Function} props.onPaid   Callback setelah pembayaran terkirim (payableId, { keepOpen })
 */
export default function PaymentModal({ payable, type, onClose, onPaid }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState('midtrans');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState(null);

  // Blokir scroll body saat modal terbuka.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Prefill nominal saat payable berubah / metode transfer dipilih.
  useEffect(() => {
    if (payable && !amount) setAmount(String(Number(payable.total) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payable]);

  if (!payable) return null;

  const total = Number(payable.total) || 0;
  const isManual = selected === 'transfer' || selected === 'cod' || selected === 'face_to_face';
  const isCash = selected === 'cod' || selected === 'face_to_face';

  async function payWithMidtrans() {
    setProcessing(true);
    setError(null);
    try {
      const result = await createMidtransTransaction(payable.id, type);
      const tx = result?.transaction || {};
      const clientKey = tx.client_key;
      const snapToken = tx.snap_token;

      if (!snapToken) throw new Error(result?.message || t('payment.snap_unavailable'));

      // Muat snap.js dengan client key dari backend sebelum snap.pay.
      await loadSnapScript(tx.is_production, clientKey);

      window.snap.pay(snapToken, {
        onSuccess: () => {
          onPaid?.(payable.id);
          onClose?.();
        },
        onPending: () => {
          onPaid?.(payable.id);
          onClose?.();
        },
        onError: () => {
          setProcessing(false);
          setError(t('payment.midtrans_failed'));
        },
        onClose: () => {
          setProcessing(false);
          setError(t('payment.midtrans_closed'));
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.message === 'snap_load_failed' ? t('payment.snap_load_failed') : null) ||
          err.message ||
          t('payment.midtrans_create_failed')
      );
      setProcessing(false);
    }
  }

  async function submitManual() {
    const numericAmount = Number(amount);
    setError(null);

    if (!numericAmount || numericAmount <= 0) {
      setError(t('payment.amount_required'));
      return;
    }
    if (selected === 'transfer' && !proof) {
      setError(t('payment.proof_required'));
      return;
    }
    // COD / face_to_face tidak butuh bukti; nominal tetap dicatat sebagai tagihan.

    setProcessing(true);
    try {
      await submitPayment(type, payable.id, { payment_method: selected, amount: numericAmount, proof });
      setDone(
        selected === 'transfer'
          ? t('payment.transfer_sent')
          : isCash
            ? t('payment.cash_recorded')
            : t('payment.recorded')
      );
      // Refresh data di belakang modal, tapi biarkan modal terbuka
      // supaya user sempat membaca pesan konfirmasinya.
      onPaid?.(payable.id, { keepOpen: true });
    } catch (err) {
      setError(err.response?.data?.message || t('payment.submit_failed'));
    } finally {
      setProcessing(false);
    }
  }

  function handleConfirm() {
    if (done) return;
    if (selected === 'midtrans') payWithMidtrans();
    else submitManual();
  }

  const entityLabel = payable.order_number || `#${payable.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="card-lux max-h-[92vh] w-full max-w-md overflow-y-auto !rounded-t-3xl p-6 sm:!rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="mt-4 font-display text-lg font-extrabold text-charcoal">{t('payment.thank_you')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{done}</p>
            <button onClick={onClose} className="mt-5 w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold">{t('payment.done')}</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-charcoal">{t('payment.choose_method')}</h2>
                <p className="mt-0.5 text-xs text-gray-400">{payable.label ? `${payable.label} · ${entityLabel}` : entityLabel}</p>
              </div>
              <button onClick={onClose} aria-label={t('payment.close')} className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-charcoal">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-primary/5 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('payment.total')}</span>
                <span className="font-display text-lg font-extrabold text-primary">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    selected === m.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-gray-200 hover:border-gold/60'
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected === m.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-charcoal">{t(m.titleKey)}</span>
                      {m.badgeKey && <span className="badge-gold !text-[10px] !py-0.5">{t(m.badgeKey)}</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">{t(m.descKey)}</span>
                  </span>
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${selected === m.id ? 'border-primary bg-primary ring-2 ring-inset ring-white' : 'border-gray-300'}`} />
                </button>
              ))}
            </div>

            {selected === 'transfer' && (
              <div className="mt-4 space-y-3 rounded-xl border border-dashed border-gold/50 bg-gold/5 p-4">
                <div>
                  <label className="label-lux">{t('payment.transfer_amount')}</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-lux mt-1"
                    placeholder={String(total)}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">{t('payment.transfer_amount_note')}</p>
                </div>
                <div>
                  <label className="label-lux">{t('payment.transfer_proof')}</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-primary/90"
                  />
                  {proof && <p className="mt-1 text-[11px] text-green-600">✔ {proof.name}</p>}
                </div>
              </div>
            )}

            {error && <div className="mt-4 alert-lux-error !text-xs">{error}</div>}

            <button
              onClick={handleConfirm}
              disabled={processing}
              className="mt-5 w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              {processing ? t('common.processing') : selected === 'midtrans' ? t('payment.pay_now') : t('payment.submit_payment')}
            </button>
            <p className="mt-2.5 text-center text-[11px] leading-relaxed text-gray-400">
              {isManual ? t('payment.manual_verify_note') : t('payment.midtrans_note')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
