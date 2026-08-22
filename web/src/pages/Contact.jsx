import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const inputCls =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700';

  function handleSubmit(e) {
    e.preventDefault();
    // In a real app, this would send to API. For now, just show success.
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Hubungi Kami</h1>
        <p className="mx-auto mt-2 max-w-xl text-gray-600">
          Ada pertanyaan tentang truck, jeruk, atau layanan kami? Jangan ragu untuk menghubungi
          tim Dadi Mulyo. Kami siap membantu Anda.
        </p>
      </div>

      {/* Quick Contact Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-white p-5 text-center transition hover:shadow-md"
        >
          <div className="text-3xl">💬</div>
          <h3 className="mt-2 font-bold text-gray-900">WhatsApp</h3>
          <p className="mt-1 text-sm text-secondary">0812-3456-7890</p>
          <p className="mt-1 text-xs text-gray-500">Chat langsung dengan kami</p>
        </a>
        <a
          href="tel:081234567890"
          className="rounded-lg border bg-white p-5 text-center transition hover:shadow-md"
        >
          <div className="text-3xl">📞</div>
          <h3 className="mt-2 font-bold text-gray-900">Telepon</h3>
          <p className="mt-1 text-sm text-secondary">0812-3456-7890</p>
          <p className="mt-1 text-xs text-gray-500">Senin – Sabtu, 08.00 – 17.00</p>
        </a>
        <a
          href="mailto:info@dadimulyo.com"
          className="rounded-lg border bg-white p-5 text-center transition hover:shadow-md"
        >
          <div className="text-3xl">✉️</div>
          <h3 className="mt-2 font-bold text-gray-900">Email</h3>
          <p className="mt-1 text-sm text-secondary">info@dadimulyo.com</p>
          <p className="mt-1 text-xs text-gray-500">Respon dalam 1×24 jam</p>
        </a>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Contact Info */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Informasi Lengkap</h2>
          <div className="mt-4 space-y-5 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <div className="font-semibold text-gray-900">Alamat</div>
                <div className="text-gray-600">
                  Wagir, Kabupaten Malang
                  <br />
                  Jawa Timur, Indonesia
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🕐</span>
              <div>
                <div className="font-semibold text-gray-900">Jam Operasional</div>
                <div className="text-gray-600">Senin – Sabtu: 08.00 – 17.00 WIB</div>
                <div className="text-gray-600">Minggu & Hari Libur Nasional: Tutup</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🚛</span>
              <div>
                <div className="font-semibold text-gray-900">Layanan</div>
                <div className="text-gray-600">
                  Penjualan truck baru & bekas
                  <br />
                  Penyewaan truck harian
                  <br />
                  Marketplace jeruk segar
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🚚</span>
              <div>
                <div className="font-semibold text-gray-900">Area Pengiriman</div>
                <div className="text-gray-600">
                  Seluruh Jawa Timur dan sekitarnya
                  <br />
                  <span className="text-xs text-gray-500">
                    Hubungi kami untuk cek area spesifik
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Kirim Pesan</h2>
          <p className="mt-1 text-xs text-gray-500">
            Isi form di bawah, kami akan merespons secepatnya.
          </p>

          {submitted ? (
            <div className="mt-6 rounded bg-green-100 p-4 text-center text-green-800">
              <p className="text-lg font-semibold">Terima kasih! 🙏</p>
              <p className="mt-1 text-sm">Pesan Anda telah kami terima. Kami akan segera merespons.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-sm font-medium text-green-700 underline"
              >
                Kirim pesan lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className={labelCls}>Nama Lengkap *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Masukkan nama lengkap Anda"
                  className={inputCls}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@contoh.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Subjek</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Pilih subjek...</option>
                  <option value="truck_sale">Pembelian Truck</option>
                  <option value="truck_rental">Penyewaan Truck</option>
                  <option value="orange_order">Pemesanan Jeruk</option>
                  <option value="delivery">Pengiriman</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Pesan *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tuliskan pesan Anda di sini... Misalnya: truck apa yang tersedia, berapa harga jeruk grosir, dll."
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90"
              >
                Kirim Pesan
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Map placeholder */}
      <section className="mt-8 overflow-hidden rounded-lg border bg-gray-100">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="text-4xl">🗺️</div>
            <p className="mt-2 text-sm font-medium text-gray-600">
              Wagir, Kabupaten Malang, Jawa Timur
            </p>
            <a
              href="https://maps.google.com/?q=Wagir+Malang+Jawa+Timur"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-secondary hover:underline"
            >
              Buka di Google Maps →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
