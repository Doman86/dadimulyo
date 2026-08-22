import { Link } from 'react-router-dom';

const FAQ_SECTIONS = [
  {
    title: 'Pembelian Jeruk',
    icon: '🍊',
    items: [
      {
        q: 'Bagaimana cara membeli jeruk di Dadi Mulyo?',
        a: 'Pilih produk jeruk yang diinginkan di halaman "Jeruk", masukkan jumlah (kg), tambahkan ke keranjang, lalu lakukan checkout. Isi alamat pengiriman dan submit pesanan. Tim kami akan menghubungi Anda untuk konfirmasi pesanan dan detail pembayaran.',
      },
      {
        q: 'Berapa minimum order jeruk?',
        a: 'Minimum order bervariasi per produk, biasanya mulai dari 2–10 kg. Lihat detail produk untuk informasi minimum order yang berlaku. Jika membeli dalam jumlah besar, hubungi kami untuk harga khusus.',
      },
      {
        q: 'Apakah ada harga grosir?',
        a: 'Ya! Untuk pembelian 50 kg atau lebih per produk, harga grosir otomatis berlaku di sistem. Harga grosir sudah terlihat di halaman produk. Semakin banyak yang dibeli, semakin hemat.',
      },
      {
        q: 'Apa saja grade jeruk yang tersedia?',
        a: 'Kami menyediakan jeruk dalam 3 grade: Grade A (premium, ukuran besar, seragam), Grade B (kualitas baik, ukuran sedang), dan Grade C (standar, cocok untuk jus). Setiap grade memiliki harga yang berbeda.',
      },
      {
        q: 'Metode pembayaran apa yang diterima?',
        a: 'Kami menerima transfer bank (BCA, Mandiri, BRI, BNI) dan pembayaran di lokasi. Detail rekening dan konfirmasi pembayaran akan dikirimkan setelah pesanan Anda diterima dan dikonfirmasi oleh tim kami.',
      },
      {
        q: 'Apakah bisa pesan untuk pengiriman ke luar Jawa Timur?',
        a: 'Saat ini kami fokus melayani pengiriman di seluruh Jawa Timur dan sekitarnya. Untuk pengiriman ke luar Jawa Timur, silakan hubungi kami langsung untuk discuss kemungkinan dan biaya pengiriman.',
      },
    ],
  },
  {
    title: 'Sewa Truck',
    icon: '🚚',
    items: [
      {
        q: 'Bagaimana cara menyewa truck?',
        a: 'Klik menu "Sewa" di navigasi, pilih truck yang diinginkan dari daftar, tentukan tanggal mulai dan selesai, lalu klik "Cek Ketersediaan". Jika truck tersedia, klik "Booking Sekarang". Anda harus login untuk melakukan booking.',
      },
      {
        q: 'Berapa lama durasi minimal sewa?',
        a: 'Durasi minimal sewa adalah 1 hari. Anda bisa menyewa untuk beberapa hari, minggu, atau sesuai kebutuhan. Harga dihitung per hari.',
      },
      {
        q: 'Bagaimana jika truck yang saya inginkan tidak tersedia?',
        a: 'Jika truck tidak tersedia pada tanggal yang dipilih, sistem akan memberitahu Anda. Anda bisa memilih tanggal lain atau memilih truck lain yang tersedia. Hubungi kami jika butuh bantuan mencari alternatif.',
      },
      {
        q: 'Apakah biaya sewa sudah termasuk sopir?',
        a: 'Harga sewa yang tercantum adalah biaya truck saja. Untuk kebutuhan sopir, silakan hubungi kami langsung. Kami bisa mengaturkan sopir dengan biaya tambahan.',
      },
      {
        q: 'Bagaimana proses pengembalian truck?',
        a: 'Truck dikembalikan sesuai tanggal yang telah disepakati. Pastikan kondisi truck saat dikembalikan sesuai saat disewa. Jika ada kerusakan di luar kondisi normal, akan dikenakan biaya tambahan.',
      },
    ],
  },
  {
    title: 'Pembelian Truck',
    icon: '🚛',
    items: [
      {
        q: 'Bagaimana cara menghubungi sales untuk pembelian truck?',
        a: 'Buka halaman detail truck yang diminati, lalu isi form "Hubungi Sales" di bagian bawah halaman. Tim sales kami akan segera menghubungi Anda via telepon atau WhatsApp.',
      },
      {
        q: 'Apakah bisa nego harga?',
        a: 'Ya, harga yang tercantum bisa dinego. Silakan hubungi tim sales kami melalui form di halaman detail truck atau langsung via WhatsApp di 0812-3456-7890.',
      },
      {
        q: 'Apakah ada garansi untuk truck bekas?',
        a: 'Setiap truck bekas yang dijual telah melalui inspeksi dan pengecekan menyeluruh. Kondisi truck dijelaskan secara transparan di halaman detail. Untuk informasi garansi lebih lanjut, silakan tanyakan ke tim sales kami.',
      },
      {
        q: 'Bisakah saya lihat truck langsung sebelum beli?',
        a: 'Tentu! Anda bisa datang langsung ke showroom kami di Wagir, Kabupaten Malang. Hubungi kami terlebih dahulu untuk memastikan truck yang Anda minati masih tersedia.',
      },
    ],
  },
  {
    title: 'Pengiriman & Pesanan',
    icon: '📦',
    items: [
      {
        q: 'Area pengiriman jeruk sampai mana?',
        a: 'Saat ini kami melayani pengiriman ke seluruh Jawa Timur dan sekitarnya. Untuk area pengiriman spesifik, silakan hubungi kami. Kami terus memperluas jangkauan pengiriman.',
      },
      {
        q: 'Bagaimana cara melihat status pesanan saya?',
        a: 'Login ke akun Anda, buka Dashboard, dan lihat bagian "Pesanan Terbaru". Klik pesanan untuk melihat detail status. Anda juga bisa menuju halaman "Pesanan" dari navigasi.',
      },
      {
        q: 'Apakah bisa membatalkan pesanan?',
        a: 'Pesanan yang belum dikonfirmasi bisa dibatalkan. Silakan hubungi kami segera untuk pembatalan. Pesanan yang sudah dalam proses pengiriman tidak bisa dibatalkan.',
      },
      {
        q: 'Berapa lama proses pengiriman?',
        a: 'Pengiriman dalam kota Malang biasanya 1–2 hari. Pengiriman ke kota lain di Jawa Timur biasanya 2–5 hari kerja. Estimasi bisa berubah tergantung kondisi dan lokasi pengiriman.',
      },
    ],
  },
  {
    title: 'Akun & Umum',
    icon: '👤',
    items: [
      {
        q: 'Bagaimana cara mendaftar akun?',
        a: 'Klik "Daftar" di pojok kanan atas, isi nama, email, dan password Anda. Akun akan langsung aktif dan bisa digunakan untuk berbelanja, menyewa truck, dan mengakses dashboard.',
      },
      {
        q: 'Apakah saya harus login untuk berbelanja?',
        a: 'Anda bisa menjelajahi produk tanpa login. Namun, untuk menambahkan ke keranjang, melakukan checkout, menyimpan wishlist, atau melihat riwayat pesanan, Anda perlu login.',
      },
      {
        q: 'Bagaimana cara menyimpan truck ke wishlist?',
        a: 'Buka halaman detail truck, klik tombol "♡ Simpan". Truck akan tersimpan di wishlist Anda. Login diperlukan untuk menggunakan fitur ini.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Ya, kami menggunakan enkripsi untuk semua data sensitif. Password tidak pernah disimpan dalam format teks. Kami tidak membagikan data pribadi Anda ke pihak ketiga.',
      },
    ],
  },
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Pertanyaan Umum (FAQ)</h1>
        <p className="mx-auto mt-2 max-w-xl text-gray-600">
          Temukan jawaban atas pertanyaan yang sering ditanyakan tentang layanan Dadi Mulyo —
          pembelian jeruk, sewa truck, pembelian truck, dan pengiriman.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">{section.icon}</span>
              <h2 className="text-lg font-bold text-primary">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-lg border bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-gray-900 hover:text-primary">
                    {faq.q}
                    <span className="ml-2 shrink-0 text-gray-400 transition group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-lg bg-primary p-8 text-center text-white">
        <h2 className="text-xl font-bold">Masih Ada Pertanyaan?</h2>
        <p className="mt-2 text-gray-300">
          Jangan ragu untuk menghubungi kami langsung. Tim kami siap membantu Anda.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="rounded bg-secondary px-6 py-2.5 font-semibold hover:opacity-90"
          >
            Hubungi Kami
          </Link>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-white px-6 py-2.5 font-semibold hover:bg-white hover:text-primary-dark"
          >
            Chat WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
