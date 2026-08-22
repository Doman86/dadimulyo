# Dadi Mulyo Digital Platform

Platform digital untuk bisnis **Dadi Mulyo** (Wagir, Kabupaten Malang, Jawa Timur):
showroom & penjualan truck, penyewaan truck, marketplace jeruk, sistem pesanan, dan pengiriman.

## Struktur Repository

```
DADI-MULYO/
├── backend/   # Laravel REST API (Sanctum auth, MySQL)
├── web/       # React + Vite + Tailwind (web app)
├── mobile/    # Flutter (mobile app)
├── database/  # Ekspor/backup skema database
├── docs/      # Source of truth: 00-master-context.json s/d 13-roadmap.json
└── konsep/    # Konsep awal proyek (vibecoding.md)
```

## Teknologi

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Backend  | Laravel 13, Laravel Sanctum, MySQL         |
| Web      | React, Vite, Tailwind CSS, React Router, Axios |
| Mobile   | Flutter, Provider, Dio/http                 |

## Menjalankan di Lokal (Laragon)

### 1. Backend (port 8000)

```bash
cd backend
composer install
cp .env.example .env
# set DB_DATABASE=dadimulyo (MySQL), lalu:
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Endpoint API: `http://localhost:8000/api` (lihat `docs/05-api.json`).
Akun admin awal: `admin@dadimulyo.com` / `password`.

### 2. Web (port 5173)

```bash
cd web
cp .env.example .env   # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

### 3. Mobile

```bash
cd mobile
flutter run
```

## Test

```bash
cd backend
php artisan test
```

Test memakai database MySQL `dadimulyo_test` (dibuat otomatis dengan `RefreshDatabase`).

## Catatan

- `docs/` adalah **source of truth** untuk seluruh kebutuhan proyek — baca sebelum coding.
- Target deploy: shared hosting (tanpa S3, VPS, Docker, atau Kubernetes).
- `backend/composer.json` menggunakan `optimize-autoloader: false` untuk kenyamanan dev di Windows;
  untuk production jalankan `composer install --optimize-autoloader`.
