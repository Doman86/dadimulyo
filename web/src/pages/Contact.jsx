import { useState } from 'react';
import Reveal from '../components/Reveal';
import { submitLead } from '../api/trucks';
import siteConfig from '../config/site';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await submitLead({
        name: form.name,
        phone: form.phone,
        message: form.message
          ? `${form.subject ? `[${form.subject}] ` : ''}${form.message}${form.email ? `\n\nEmail: ${form.email}` : ''}`
          : `Kontak dari website${form.email ? ` — Email: ${form.email}` : ''}`,
        source: 'contact_page',
      });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError('Gagal mengirim pesan. Silakan coba lagi atau hubungi kami via WhatsApp.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 -left-20 opacity-30" />
        <div className="orb orb-3 bottom-[-50px] right-20 opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">Hubungi Kami</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">Kontak</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">
              Ada pertanyaan tentang truck, jeruk, atau layanan kami? Jangan ragu untuk menghubungi
              tim {siteConfig.company.name}.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Quick Contact Cards */}
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>, title: 'WhatsApp', value: siteConfig.contact.phone, sub: 'Chat langsung dengan kami', href: siteConfig.contact.whatsappUrl },
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>, title: 'Telepon', value: siteConfig.contact.phone, sub: siteConfig.hours.short, href: `tel:${siteConfig.contact.phoneDigits}` },
              { icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>, title: 'Email', value: siteConfig.contact.email, sub: 'Respon dalam 1×24 jam', href: `mailto:${siteConfig.contact.email}` },
            ].map((item, i) => (
              <Reveal key={item.title} variant="up" delay={i * 100}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="card-lux group block p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest/10 to-gold/10 text-primary group-hover:from-gold/20 group-hover:to-gold/5 transition-all duration-500">
                    {item.icon}
                  </div>
                  <h3 className="mt-3 font-bold text-charcoal">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-secondary">{item.value}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.sub}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <Reveal variant="left">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-lg font-bold text-charcoal">Informasi Lengkap</h2>
              <div className="mt-4 space-y-5 text-sm">
                {[
                  { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>, label: 'Alamat', lines: [siteConfig.address.street, siteConfig.address.province + ', ' + siteConfig.address.country] },
                  { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Jam Operasional', lines: [siteConfig.hours.weekday, siteConfig.hours.weekend] },
                  { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>, label: 'Layanan', lines: ['Penjualan truck baru & bekas', 'Penyewaan truck harian', 'Marketplace jeruk segar'] },
                  { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>, label: 'Area Pengiriman', lines: [siteConfig.serviceArea] },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</div>
                    <div>
                      <div className="font-bold text-charcoal">{item.label}</div>
                      {item.lines.map((line, j) => (
                        <div key={j} className="text-gray-500">{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* Contact Form */}
          <Reveal variant="right">
            <section className="card-lux p-6 !rounded-2xl">
              <h2 className="font-display text-lg font-bold text-charcoal">Kirim Pesan</h2>
              <p className="mt-1 text-xs text-gray-400">Isi form di bawah, kami akan merespons secepatnya.</p>

              {submitted ? (
                <div className="mt-6 text-center py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <p className="mt-4 text-lg font-bold text-charcoal">Terima kasih!</p>
                  <p className="mt-1 text-sm text-gray-500">Pesan Anda telah kami terima. Kami akan segera merespons.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-4 btn-outline-lux rounded-full px-6 py-2 text-sm font-bold">
                    Kirim pesan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {error && <div className="alert-lux-error">{error}</div>}
                  <div>
                    <label className="label-lux">Nama Lengkap *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masukkan nama lengkap Anda" className="input-lux" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-lux">Email</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className="input-lux" />
                    </div>
                    <div>
                      <label className="label-lux">No. HP / WhatsApp *</label>
                      <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812-xxxx-xxxx" className="input-lux" />
                    </div>
                  </div>
                  <div>
                    <label className="label-lux">Subjek</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-lux">
                      <option value="">Pilih subjek...</option>
                      <option value="truck_sale">Pembelian Truck</option>
                      <option value="truck_rental">Penyewaan Truck</option>
                      <option value="orange_order">Pemesanan Jeruk</option>
                      <option value="delivery">Pengiriman</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-lux">Pesan *</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tuliskan pesan Anda di sini..." className="input-lux" />
                  </div>
                  <button type="submit" disabled={sending} className="w-full btn-lux rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60">
                    {sending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                        Mengirim...
                      </span>
                    ) : 'Kirim Pesan'}
                  </button>
                </form>
              )}
            </section>
          </Reveal>
        </div>

        {/* Map placeholder */}
        <Reveal>
          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-sand">
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <p className="font-semibold text-charcoal">{siteConfig.address.full}</p>
                <a
                  href={siteConfig.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
                >
                  Buka di Google Maps
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                </a>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
