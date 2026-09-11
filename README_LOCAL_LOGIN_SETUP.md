# Local Login Setup — Dadi Mulyo

## 1. Pastikan Backend Berjalan

```bash
cd backend
php artisan serve
```

Backend akan berjalan di `http://localhost:8000`. Pastikan tidak ada proses lain yang menggunakan port 8000.

## 2. Konfigurasi .env

File `.env` sudah dibuat dengan pengaturan development. Pastikan:

- `APP_ENV=local`
- `APP_DEBUG=true`
- `AUTH_OTP_REQUIRED=false`
- `MAIL_MAILER=log`
- `DB_CONNECTION=mysql` (sesuaikan dengan database lokal Anda)

Jika database MySQL belum berjalan atau ingin pakai SQLite:

```bash
# Ganti di .env:
DB_CONNECTION=sqlite
# Hapus DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
```

Buat file database SQLite:

```bash
touch backend/database/database.sqlite
```

## 3. Migrasi & Seeder

```bash
cd backend
php artisan migrate --force
php artisan db:seed --force
```

Ini akan membuat tabel dan data admin default.

## 4. Login Tanpa OTP

Karena `AUTH_OTP_REQUIRED=false`, login langsung menghasilkan token. Contoh:

**Web / Postman:**
```
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "admin@dadimulyo.my.id",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "needs_otp": false,
    "user": { ... },
    "token": "1|..."
  }
}
```

## 5. Konfigurasi Frontend

### Web (React)
Buat file `.env` di folder `web/`:

```
VITE_API_URL=http://localhost:8000/api
```

Lalu jalankan:

```bash
cd web
npm run dev
```

### Mobile (Flutter)
Jalankan dengan IP localhost:

```bash
cd mobile
flutter run --dart-define=SERVER_IP=127.0.0.1
```

Atau untuk emulator Android gunakan default `10.0.2.2:8000`.

## Troubleshooting

### "Tidak dapat terhubung ke server"
- Backend Laravel tidak berjalan. Jalankan `php artisan serve`.
- Frontend mengakses URL yang salah. Cek `VITE_API_URL` atau `SERVER_IP`.

### "Email atau password salah"
- Pastikan user sudah di-seed: `php artisan db:seed --force`
- Cek password default: `password`
- Cek `AUTH_OTP_REQUIRED=false` di `.env`

### Error migrasi database
- Pastikan MySQL berjalan atau gunakan SQLite.
- Cek kredensial di `.env`.
