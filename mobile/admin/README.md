# Dashboard Admin - Dadi Mulyo

Admin panel untuk mengelola:
- 📦 **Produk** (Truck & Jeruk) - CRUD produk, stok, harga
- 🛒 **Pesanan** (Orders) - Konfirmasi, proses, selesai
- 🚛 **Sewa** (Rentals) - Setujui, tolak, jadwalkan
- 👤 **Pelanggan** - Lihat data pelanggan
- 💰 **Keuangan** - Laporan penjualan
- ⭐ **Ulasan** - Moderasi ulasan

## Cara Menjalankan

```bash
# Install dependencies
flutter pub get

# Jalankan dalam mode web
flutter run -d chrome --web-port=8080

# Build untuk produksi
flutter build web --release
```

## Struktur Folder

```
admin/
├── lib/
│   ├── main.dart              # Entry point
│   ├── config/
│   │   └── admin_config.dart  # Konfigurasi admin
│   ├── screens/
│   │   ├── login_screen.dart  # Login admin
│   │   ├── dashboard_screen.dart # Dashboard utama
│   │   ├── products/
│   │   │   ├── truck_list.dart
│   │   │   └── orange_list.dart
│   │   ├── orders/
│   │   │   └── order_list.dart
│   │   ├── rentals/
│   │   │   └── rental_list.dart
│   │   ├── customers/
│   │   │   └── customer_list.dart
│   │   ├── reviews/
│   │   │   └── review_list.dart
│   │   └── reports/
│   │       └── sales_report.dart
│   ├── services/
│   │   └── admin_api.dart     # API calls
│   └── widgets/
│       └── sidebar.dart       # Sidebar navigation
├── pubspec.yaml
└── web/
    └── index.html
```

## Fitur

### Dashboard
- Total penjualan hari ini
- Pesanan baru menunggu konfirmasi
- Sewa menunggu persetujuan
- Grafik penjualan mingguan

### Manajemen Produk
- Tambah/edit/hapus truck
- Tambah/edit/hapus jeruk
- Update stok & harga
- Upload foto produk

### Manajemen Pesanan
- Lihat semua pesanan
- Konfirmasi pembayaran
- Update status pesanan
- Lihat bukti transfer

### Manajemen Sewa
- Lihat booking masuk
- Setujui/tolak booking
- Assign driver
- Lihat jadwal

### Keuangan
- Laporan penjualan harian/mingguan/bulanan
- Total pendapatan
- Pengeluaran driver

### Moderasi Ulasan
- Approve/reject ulasan
- Balas ulasan
