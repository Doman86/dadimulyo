import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import siteConfig from '../config/site';

const FAQ_SECTIONS = [
  {
    title: 'Pembelian Jeruk',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
    items: [
      { q: `Bagaimana cara membeli jeruk di ${siteConfig.company.name}?`, a: 'Pilih produk jeruk yang diinginkan di halaman "Jeruk", masukkan jumlah (kg), tambahkan ke keranjang, lalu lakukan checkout. Isi alamat pengiriman dan submit pesanan. Tim kami akan menghubungi Anda untuk konfirmasi pesanan dan detail pembayaran.' },
      { q: 'Berapa minimum order jeruk?', a: 'Minimum order bervariasi per produk, biasanya mulai dari 2–10 kg. Lihat detail produk untuk informasi minimum order yang berlaku. Jika membeli dalam jumlah besar, hubungi kami untuk harga khusus.' },
      { q: 'Apakah ada harga grosir?', a: 'Ya! Untuk pembelian 50 kg atau lebih per produk, harga grosir otomatis berlaku di sistem. Harga grosir sudah terlihat di halaman produk. Semakin banyak yang dibeli, semakin hemat.' },
      { q: 'Apa saja grade jeruk yang tersedia?', a: 'Kami menyediakan jeruk dalam 3 grade: Grade A (premium, ukuran besar, seragam), Grade B (kualitas baik, ukuran sedang), dan Grade C (standar, cocok untuk jus). Setiap grade memiliki harga yang berbeda.' },
      { q: 'Metode pembayaran apa yang diterima?', a: 'Kami menerima transfer bank (BCA, Mandiri, BRI, BNI) dan pembayaran di lokasi. Detail rekening dan konfirmasi pembayaran akan dikirimkan setelah pesanan Anda diterima dan dikonfirmasi oleh tim kami.' },
      { q: 'Apakah bisa pesan untuk pengiriman ke luar Jawa Timur?', a: 'Saat ini kami fokus melayani pengiriman di seluruh Jawa Timur dan sekitarnya. Untuk pengiriman ke luar Jawa Timur, silakan hubungi kami langsung untuk discuss kemungkinan dan biaya pengiriman.' },
    ],
  },
  {
    title: 'Sewa Truck',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    items: [
      { q: 'Bagaimana cara menyewa truck?', a: 'Klik menu "Sewa" di navigasi, pilih truck yang diinginkan dari daftar, tentukan tanggal mulai dan selesai, lalu klik "Cek Ketersediaan". Jika truck tersedia, klik "Booking Sekarang". Anda harus login untuk melakukan booking.' },
      { q: 'Berapa lama durasi minimal sewa?', a: 'Durasi minimal sewa adalah 1 hari. Anda bisa menyewa untuk beberapa hari, minggu, atau sesuai kebutuhan. Harga dihitung per hari.' },
      { q: 'Bagaimana jika truck yang saya inginkan tidak tersedia?', a: 'Jika truck tidak tersedia pada tanggal yang dipilih, sistem akan memberitahu Anda. Anda bisa memilih tanggal lain atau memilih truck lain yang tersedia.' },
      { q: 'Apakah biaya sewa sudah termasuk sopir?', a: 'Harga sewa yang tercantum adalah biaya truck saja. Untuk kebutuhan sopir, silakan hubungi kami langsung. Kami bisa mengaturkan sopir dengan biaya tambahan.' },
      { q: 'Bagaimana proses pengembalian truck?', a: 'Truck dikembalikan sesuai tanggal yang telah disepakati. Pastikan kondisi truck saat dikembalikan sesuai saat disewa.' },
    ],
  },
  {
    title: 'Pembelian Truck',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>,
    items: [
      { q: 'Bagaimana cara menghubungi sales untuk pembelian truck?', a: 'Buka halaman detail truck yang diminati, lalu isi form "Hubungi Sales" di bagian bawah halaman. Tim sales kami akan segera menghubungi Anda via telepon atau WhatsApp.' },
      { q: 'Apakah bisa nego harga?', a: `Ya, harga yang tercantum bisa dinego. Silakan hubungi tim sales kami melalui form di halaman detail truck atau langsung via WhatsApp di ${siteConfig.contact.phone}.` },
      { q: 'Apakah ada garansi untuk truck bekas?', a: 'Setiap truck bekas yang dijual telah melalui inspeksi dan pengecekan menyeluruh. Kondisi truck dijelaskan secara transparan di halaman detail.' },
      { q: 'Bisakah saya lihat truck langsung sebelum beli?', a: 'Tentu! Anda bisa datang langsung ke showroom kami di Wagir, Kabupaten Malang. Hubungi kami terlebih dahulu untuk memastikan truck yang Anda minati masih tersedia.' },
    ],
  },
  {
    title: 'Pengiriman & Pesanan',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
    items: [
      { q: 'Area pengiriman jeruk sampai mana?', a: 'Saat ini kami melayani pengiriman ke seluruh Jawa Timur dan sekitarnya. Kami terus memperluas jangkauan pengiriman.' },
      { q: 'Bagaimana cara melihat status pesanan saya?', a: 'Login ke akun Anda, buka Dashboard, dan lihat bagian "Pesanan Terbaru". Klik pesanan untuk melihat detail status.' },
      { q: 'Apakah bisa membatalkan pesanan?', a: 'Pesanan yang belum dikonfirmasi bisa dibatalkan. Silakan hubungi kami segera untuk pembatalan.' },
      { q: 'Berapa lama proses pengiriman?', a: 'Pengiriman dalam kota Malang biasanya 1–2 hari. Pengiriman ke kota lain di Jawa Timur biasanya 2–5 hari kerja.' },
    ],
  },
  {
    title: 'Akun & Umum',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    items: [
      { q: 'Bagaimana cara mendaftar akun?', a: 'Klik "Daftar" di pojok kanan atas, isi nama, email, dan password Anda. Akun akan langsung aktif dan bisa digunakan untuk berbelanja, menyewa truck, dan mengakses dashboard.' },
      { q: 'Apakah saya harus login untuk berbelanja?', a: 'Anda bisa menjelajahi produk tanpa login. Namun, untuk menambahkan ke keranjang, melakukan checkout, menyimpan wishlist, atau melihat riwayat pesanan, Anda perlu login.' },
      { q: 'Bagaimana cara menyimpan truck ke wishlist?', a: 'Buka halaman detail truck, klik tombol "♡ Simpan". Truck akan tersimpan di wishlist Anda. Login diperlukan untuk menggunakan fitur ini.' },
      { q: 'Apakah data saya aman?', a: 'Ya, kami menggunakan enkripsi untuk semua data sensitif. Password tidak pernah disimpan dalam format teks. Kami tidak membagikan data pribadi Anda ke pihak ketiga.' },
    ],
  },
];

export default function Faq() {
  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 left-1/3 opacity-30" />
        <div className="orb orb-2 top-10 right-[-50px] opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">Bantuan</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">Pertanyaan Umum</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">
              Temukan jawaban atas pertanyaan yang sering ditanyakan tentang layanan {siteConfig.company.name}.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-8">
          {FAQ_SECTIONS.map((section, si) => (
            <Reveal key={section.title} variant="up" delay={si * 80}>
              <section>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{section.icon}</div>
                  <h2 className="font-display text-lg font-bold text-primary">{section.title}</h2>
                </div>
                <div className="space-y-3">
                  {section.items.map((faq, i) => (
                    <details
                      key={i}
                      className="card-lux group !rounded-xl overflow-hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-charcoal hover:text-primary transition-colors">
                        <span className="pr-4">{faq.q}</span>
                        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition group-open:bg-gold/20 group-open:text-gold">
                          <svg className={`h-4 w-4 transition-transform duration-300 ${i === 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </span>
                      </summary>
                      <div className="px-5 pb-5 text-sm leading-relaxed text-gray-500 border-t border-gray-100 pt-4">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal>
          <section className="mt-14 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-forest to-pine p-8 text-center text-white">
            <div className="orb orb-1 -top-10 -right-10 !w-40 !h-40 opacity-40" />
            <div className="hero-grid-bg absolute inset-0" />
            <div className="noise-overlay absolute inset-0" />
            <div className="relative z-10">
              <h2 className="font-display text-xl font-bold">Masih Ada Pertanyaan?</h2>
              <p className="mt-2 text-white/50 text-sm">
                Jangan ragu untuk menghubungi kami langsung. Tim kami siap membantu Anda.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-4">
                <Link to="/contact" className="btn-lux rounded-full px-6 py-2.5 text-sm font-bold">Hubungi Kami</Link>
                <a href={siteConfig.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-lux rounded-full px-6 py-2.5 text-sm font-bold text-white">
                  Chat WhatsApp
                </a>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
