import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import siteConfig from '../config/site';

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-1 -top-20 left-1/4 opacity-30" />
        <div className="orb orb-2 top-10 right-[-50px] opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <span className="section-label centered text-gold-light/80">Tentang Kami</span>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">{siteConfig.company.name}</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-xl mx-auto leading-relaxed">
              Bisnis yang bergerak di bidang penjualan dan penyewaan truck serta marketplace jeruk segar
              yang berlokasi di {siteConfig.address.full}.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Mission & Vision */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Reveal variant="left">
            <div className="card-lux group p-8 !rounded-2xl border-l-4 border-l-gold">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold/20 transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-primary">Misi Kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Menyediakan akses mudah dan transparan terhadap truck berkualitas serta produk jeruk segar
                langsung dari petani lokal. Kami berkomitmen memberikan layanan terbaik dengan harga yang
                jujur dan proses yang sederhana.
              </p>
            </div>
          </Reveal>
          <Reveal variant="right">
            <div className="card-lux group p-8 !rounded-2xl border-l-4 border-l-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-primary">Visi Kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Menjadi platform digital terpercaya di Jawa Timur yang menghubungkan pelanggan dengan
                kebutuhan transportasi dan produk pertanian berkualitas, mendukung pertumbuhan ekonomi
                lokal.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Services */}
        <Reveal>
          <div className="mt-16 section-header">
            <span className="section-label centered">Yang Kami Tawarkan</span>
            <h2 className="mt-3">Layanan Kami</h2>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>,
              title: 'Truck Showroom',
              desc: 'Menyediakan berbagai pilihan truck baru dan bekas — Pickup, Box, Fuso, Tronton, Dump, hingga Cold Storage — dengan spesifikasi lengkap dan harga transparan.',
            },
            {
              icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
              title: 'Sewa Truck',
              desc: 'Layanan penyewaan truck harian untuk kebutuhan usaha Anda. Proses booking mudah — pilih truck, tentukan tanggal, cek ketersediaan, dan langsung booking.',
            },
            {
              icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
              title: 'Jeruk Segar',
              desc: `Jeruk berkualitas langsung dari kebun ${siteConfig.address.city}. Tersedia dalam berbagai grade (A, B, C) dengan harga eceran dan grosir.`,
            },
          ].map((item, i) => (
            <Reveal key={item.title} variant="zoom" delay={i * 100}>
              <div className="card-lux group p-6 text-center h-full">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest/10 to-gold/10 text-primary group-hover:from-gold/20 group-hover:to-gold/5 transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-charcoal">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Why Choose Us */}
        <Reveal>
          <div className="mt-16 section-header">
            <span className="section-label centered">Keunggulan</span>
            <h2 className="mt-3">Mengapa {siteConfig.company.name}?</h2>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Harga Transparan', desc: 'Semua harga tercantum jelas. Tidak ada biaya tersembunyi. Harga grosir otomatis berlaku untuk pembelian di atas 50 kg.' },
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>, title: 'Foto Asli', desc: 'Setiap truck dan produk jeruk difoto langsung dari lokasi. Anda tahu persis apa yang akan Anda dapatkan.' },
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>, title: 'Tim Sales Profesional', desc: 'Tim sales kami siap membantu Anda menemukan truck yang sesuai. Hubungi langsung dari halaman detail truck.' },
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21a.75.75 0 00.75-.75V11.25a3 3 0 00-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0014.692 2.5H9.308a1.5 1.5 0 00-1.438 1.075L6.15 8.25H3.75a3 3 0 00-3 3v6.375c0 .621.504 1.125 1.125 1.125h1.5" /></svg>, title: 'Pengiriman Terpercaya', desc: 'Pengiriman jeruk dengan truck sendiri. Jadwal fleksibel dan biaya yang bisa dikonfirmasi sebelumnya.' },
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>, title: 'Pemesanan Online', desc: 'Beli jeruk, sewa truck, dan kelola pesanan langsung dari website atau aplikasi mobile kami.' },
            { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>, title: 'Berbasis Lokal', desc: `Berlokasi di ${siteConfig.address.street}. Kami memahami kebutuhan masyarakat ${siteConfig.address.province}.` },
          ].map((item, i) => (
            <Reveal key={item.title} variant="up" delay={Math.min(i * 60, 300)}>
              <div className="card-lux group flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-charcoal">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Story */}
        <Reveal>
          <section className="mt-16 card-lux p-8 !rounded-2xl">
            <h2 className="font-display text-2xl font-bold text-primary">Cerita Kami</h2>
            <div className="mt-4 space-y-4 text-gray-600 leading-relaxed">
              <p>
                {siteConfig.company.name} didirikan dengan visi menjadi platform digital yang mendukung bisnis lokal di
                bidang otomotif dan pertanian. Berawal dari {siteConfig.address.street}, kami melayani
                kebutuhan transportasi dan produk pertanian masyarakat sekitar.
              </p>
              <p>
                Kami menyadari bahwa banyak pelanggan yang kesulitan menemukan truck yang sesuai dengan
                kebutuhan dan budget mereka. Begitu pula petani jeruk yang membutuhkan akses pasar yang
                lebih luas. {siteConfig.company.name} hadir sebagai jembatan antara kebutuhan transportasi dan produk
                pertanian.
              </p>
              <p>
                Dengan hadirnya platform digital ini, kami mempermudah pelanggan dalam menemukan truck
                yang sesuai, menyewa truck untuk kebutuhan usaha, serta membeli jeruk segar langsung
                dari kebun tanpa perantara. Semua proses bisa dilakukan secara online, kapan saja dan
                di mana saja.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Location CTA */}
        <Reveal>
          <section className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-forest to-pine p-10 text-center text-white">
            <div className="orb orb-1 -top-20 right-[-50px] !w-60 !h-60 opacity-40" />
            <div className="hero-grid-bg absolute inset-0" />
            <div className="noise-overlay absolute inset-0" />
            <div className="relative z-10">
              <h2 className="font-display text-2xl font-bold">Lokasi Kami</h2>
              <p className="mt-2 text-white/50">{siteConfig.address.full}</p>
              <p className="mt-1 text-sm text-white/30">Senin – Sabtu: 08.00 – 17.00 WIB</p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link to="/trucks" className="btn-lux rounded-full px-7 py-3 text-sm font-bold">Lihat Truck</Link>
                <Link to="/oranges" className="btn-ghost-lux rounded-full px-7 py-3 text-sm font-bold text-white">Beli Jeruk</Link>
                <Link to="/contact" className="btn-ghost-lux rounded-full px-7 py-3 text-sm font-bold text-white">Hubungi Kami</Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
