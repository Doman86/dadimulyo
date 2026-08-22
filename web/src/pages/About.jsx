import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Tentang Dadi Mulyo</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Dadi Mulyo adalah bisnis yang bergerak di bidang penjualan dan penyewaan truck serta
          marketplace jeruk segar yang berlokasi di Wagir, Kabupaten Malang, Jawa Timur. Kami hadir
          untuk mendukung kebutuhan transportasi dan produk pertanian masyarakat.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border-l-4 border-secondary bg-white p-6">
          <h2 className="text-lg font-bold text-primary">Misi Kami</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Menyediakan akses mudah dan transparan terhadap truck berkualitas serta produk jeruk segar
            langsung dari petani lokal. Kami berkomitmen memberikan layanan terbaik dengan harga yang
            jujur dan proses yang sederhana.
          </p>
        </div>
        <div className="rounded-lg border-l-4 border-primary bg-white p-6">
          <h2 className="text-lg font-bold text-primary">Visi Kami</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Menjadi platform digital terpercaya di Jawa Timur yang menghubungkan pelanggan dengan
            kebutuhan transportasi dan produk pertanian berkualitas, mendukung pertumbuhan ekonomi
            lokal.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-primary">Layanan Kami</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">🚛</div>
            <h3 className="mt-3 text-lg font-bold text-primary">Truck Showroom</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Menyediakan berbagai pilihan truck baru dan bekas — Pickup, Box, Fuso, Tronton, Dump,
              hingga Cold Storage — dengan spesifikasi lengkap, harga transparan, dan foto asli.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">📅</div>
            <h3 className="mt-3 text-lg font-bold text-primary">Sewa Truck</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Layanan penyewaan truck harian untuk kebutuhan usaha Anda. Proses booking mudah —
              pilih truck, tentukan tanggal, cek ketersediaan, dan langsung booking secara online.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">🍊</div>
            <h3 className="mt-3 text-lg font-bold text-primary">Jeruk Segar</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Jeruk berkualitas langsung dari kebun Wagir dan sekitarnya, Malang. Tersedia dalam
              berbagai grade (A, B, C) dengan harga eceran dan grosir. Pengiriman tersedia.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-primary">Mengapa Dadi Mulyo?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { icon: '✅', title: 'Harga Transparan', desc: 'Semua harga tercantum jelas. Tidak ada biaya tersembunyi. Harga grosir otomatis berlaku untuk pembelian di atas 50 kg.' },
            { icon: '📸', title: 'Foto Asli', desc: 'Setiap truck dan produk jeruk difoto langsung dari lokasi. Anda tahu persis apa yang akan Anda dapatkan.' },
            { icon: '🤝', title: 'Tim Sales Profesional', desc: 'Tim sales kami siap membantu Anda menemukan truck yang sesuai. Hubungi langsung dari halaman detail truck.' },
            { icon: '🚚', title: 'Pengiriman Terpercaya', desc: 'Pengiriman jeruk dengan truck sendiri. Jadwal fleksibel dan biaya yang bisa dikonfirmasi sebelumnya.' },
            { icon: '📱', title: 'Pemesanan Online', desc: 'Beli jeruk, sewa truck, dan kelola pesanan langsung dari website atau aplikasi mobile kami.' },
            { icon: '🏘️', title: 'Berbasis Lokal', desc: 'Berlokasi di Wagir, Kabupaten Malang. Kami memahami kebutuhan masyarakat Jawa Timur.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border bg-white p-5">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mt-12 rounded-lg bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary">Cerita Kami</h2>
        <div className="mt-4 space-y-4 text-gray-700">
          <p>
            Dadi Mulyo didirikan dengan visi menjadi platform digital yang mendukung bisnis lokal di
            bidang otomotif dan pertanian. Berawal dari Wagir, Kabupaten Malang, kami melayani
            kebutuhan transportasi dan produk pertanian masyarakat sekitar.
          </p>
          <p>
            Kami menyadari bahwa banyak pelanggan yang kesulitan menemukan truck yang sesuai dengan
            kebutuhan dan budget mereka. Begitu pula petani jeruk yang membutuhkan akses pasar yang
            lebih luas. Dadi Mulyo hadir sebagai jembatan antara kebutuhan transportasi dan produk
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

      {/* Location */}
      <section className="mt-8 rounded-lg bg-primary p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Lokasi Kami</h2>
        <p className="mt-2 text-gray-300">
          Wagir, Kabupaten Malang, Jawa Timur, Indonesia
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Senin – Sabtu: 08.00 – 17.00 WIB
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/trucks"
            className="rounded bg-secondary px-6 py-2.5 font-semibold hover:opacity-90"
          >
            Lihat Truck
          </Link>
          <Link
            to="/oranges"
            className="rounded border border-white px-6 py-2.5 font-semibold hover:bg-white hover:text-primary-dark"
          >
            Beli Jeruk
          </Link>
          <Link
            to="/contact"
            className="rounded border border-white px-6 py-2.5 font-semibold hover:bg-white hover:text-primary-dark"
          >
            Hubungi Kami
          </Link>
        </div>
      </section>
    </div>
  );
}
