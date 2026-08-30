# DADI MULYO — HOSTINGER DEPLOYMENT GUIDE (PRODUCTION)

> Status: **LIVE** — `https://dadimulyo.my.id` (di-deploy via SSH)

## Informasi Akun Aktual

| Item | Nilai |
|------|-------|
| Domain | `dadimulyo.my.id` |
| SSH host | `153.92.11.45` |
| SSH port | `65002` |
| SSH user | `u519141514` |
| SSH key (lokal) | `~/.ssh/dm_deploy` |
| Home dir | `/home/u519141514/domains/dadimulyo.my.id` |
| Keystore API `.env` | `~/.ssh/dadimulyo.secrets` (jika dibuat) |

## Architecture (Single-Domain + Proxy)

```
dadimulyo.my.id
├── public_html/                    → React SPA (web/dist/), document root
│   ├── index.html
│   ├── assets/
│   ├── .htaccess                   → SPA fallback + proxy /api/* ke api_backend
│   └── api_backend/                → Laravel API (backend/), TIDAK boleh diakses langsung
│       └── public/index.php        → entry point (via rewrite dari /api)
└── MySQL `u519141514_dadimulyo`    (user `u519141514_dadi`)
```

- Frontend & API ada di **satu domain** (`dadimulyo.my.id`), bukan subdomain terpisah.
- `.htaccess` di `public_html/` me-rewrite `^api/(.*)$` → `api_backend/public/index.php`.
- Konten `api_backend/` **selain** `public/` diblokir (`RewriteRule ... - [F,L]`).

---

## Deploy (Langganan → Server)

### 1. Build frontend lokal
```bash
cd web
npm ci
npm run build        # hasil: web/dist/
```

### 2. Backup & salin frontend
```bash
# Backup aset lama (optional)
cp index.html _secure_backup/index.html.prev
cd assets && cp index-*.js _secure_backup/ 2>/dev/null

# Salin build baru ke public_html
cp web/dist/index.html                ~/domains/dadimulyo.my.id/public_html/
cp web/dist/assets/*.js               ~/domains/dadimulyo.my.id/public_html/assets/
cp web/dist/assets/*.css              ~/domains/dadimulyo.my.id/public_html/assets/
```

> Catatan penting: bundle JS/CSS punya hash unik per build. `index.html` baru harus
> selalu dipasang **bersamaan** dengan bundle barunya, supaya tidak ada pengguna yang
> memegang `index.html` lama yang memanggil file JS lama (yang sudah terhapus).

### 3. Salin backend (hanya file yang berubah)
```bash
# Contoh: satu file controller
cp backend/app/Http/Controllers/Api/SiteStatsController.php \
   ~/domains/dadimulyo.my.id/public_html/api_backend/app/Http/Controllers/Api/
cp backend/routes/api.php \
   ~/domains/dadimulyo.my.id/public_html/api_backend/routes/api.php
```

### 4. Refresh cache Laravel di server
```bash
cd ~/domains/dadimulyo.my.id/public_html/api_backend
php artisan optimize:clear
php artisan route:cache
php artisan config:cache
```

### 5. Migrasi / seeder (jika skema/data berubah)
```bash
php artisan migrate --force
php artisan db:seed --force        # idempotent; aman dijalankan berulang
php artisan storage:link           # jika belum
```

---

## Environment (.env) — Produksi

Nilai-nilai berikut **sudah terpasang di server**:

| Variable | Production Value |
|----------|-----------------|
| APP_URL | `https://dadimulyo.my.id` |
| APP_ENV | `production` |
| APP_DEBUG | `false` |
| DB_DATABASE | `u519141514_dadimulyo` |
| DB_USERNAME | `u519141514_dadi` |
| SESSION_DOMAIN | `.dadimulyo.my.id` |
| SANCTUM_STATEFUL_DOMAINS | `dadimulyo.my.id` |
| FRONTEND_URL | `https://dadimulyo.my.id` |
| MAIL_MAILER | `log` |

Frontend memakai `VITE_API_URL=/api` (relatif) sehingga cukup satu domain, tanpa CORS.

---

## .htaccess (public_html)

Sudah terpasang di server — menangani: blokir akses internal API backend, proxy `/api/*`,
SPA fallback, `404` untuk aset yang hilang, cache HTML `no-cache`, cache aset `immutable`,
dan MIME `text/javascript` untuk `.js`.

---

## Verify (Selesai Deploy)

1. `https://dadimulyo.my.id/` → 200, konten render (desktop & mobile)
2. `https://dadimulyo.my.id/api/site-stats` → JSON `{"success":true,...}`
3. `https://dadimulyo.my.id/api/trucks` → JSON daftar truk
4. `https://dadimulyo.my.id/api/oranges` → JSON daftar jeruk
5. Login admin: akun dari hasil seed

---

## Troubleshooting

### Blank page (pengguna memegang index.html lama)
- Pastikan `index.html` diset `Cache-Control: no-cache, must-revalidate` (sudah di `.htaccess`).
- Bundle lama yang masih direferensikan `index.html` lama → `.htaccess` kini mem-`404` aset
  hilang, bukan fallback HTML (agar tidak salah MIME).

### API 404
- Cek `.htaccess` rewrite `/api/*` masih ada.
- `php artisan route:list --path=site-stats`

### Database connection refused
- Verifikasi kredensial di `.env` (lihat tabel di atas).
- Hostinger MySQL host biasanya `localhost`.

### Storage/Image tidak tampil
- `php artisan storage:link`
- `ls -la public/storage`