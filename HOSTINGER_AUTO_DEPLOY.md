# DADI MULYO — AUTOMATIC DEPLOYMENT (GitHub → Hostinger)

> **Status: LIVE** — Deploy manual via SSH sudah berjalan. Domain produksi:
> `dadimulyo.my.id` (bukan `dadimulyo.com`).

## Akses SSH Aktual

| Item | Nilai |
|------|-------|
| SSH host | `153.92.11.45` |
| SSH port | `65002` |
| SSH user | `u519141514` |
| SSH key (lokal, Windows PowerShell) | `~/.ssh/dm_deploy` |
| Frontend path | `/home/u519141514/domains/dadimulyo.my.id/public_html` |
| Backend path | `/home/u519141514/domains/dadimulyo.my.id/public_html/api_backend` |

Contoh koneksi dari lokal:
```bash
ssh -i ~/.ssh/dm_deploy -p 65002 u519141514@153.92.11.45
```

---

## Option A: GitHub Actions + Hostinger SSH (Recommended)

### Setup

1. **Enable SSH di Hostinger**:
   - Hostinger Panel → Advanced → SSH Access
   - Catat SSH host, port, dan username

2. **Tambahkan GitHub Secrets** (bila pakai CI/CD):
   Go to GitHub repo → Settings → Secrets and variables → Actions

   | Secret | Value |
   |--------|-------|
   | `HOSTINGER_SSH_HOST` | `153.92.11.45` |
   | `HOSTINGER_SSH_USER` | `u519141514` |
   | `HOSTINGER_SSH_KEY` | (isi private SSH key `~/.ssh/dm_deploy`) |
   | `HOSTINGER_SSH_PORT` | `65002` |
   | `HOSTINGER_BACKEND_PATH` | `/home/u519141514/domains/dadimulyo.my.id/public_html/api_backend` |
   | `HOSTINGER_FRONTEND_PATH` | `/home/u519141514/domains/dadimulyo.my.id/public_html` |

3. **Generate SSH key pair** (jika workflow butuh key terpisah):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
   # Tambahkan deploy_key.pub ke Hostinger: ~/.ssh/authorized_keys
   # Isi deploy_key ke GitHub Secret HOSTINGER_SSH_KEY
   ```

### Workflow

Push ke `main` → GitHub Actions menjalankan:
1. **Build** backend (`composer install --no-dev`) dan frontend (`npm run build`)
2. **Upload** via rsync/scp ke Hostinger
3. **Deploy**: migrate, cache config, perbaiki permissions

### Manual Trigger

```bash
git push origin main
```

---

## Option B: Git Pull di Hostinger

1. **Init Git di Hostinger**:
   ```bash
   cd /home/u519141514/domains/dadimulyo.my.id/public_html
   git init
   git remote add origin https://github.com/Doman86/dadimulyo.git
   git fetch origin main
   git checkout main
   ```

2. **Post-pull hook** (`post-pull.sh`):
   ```bash
   #!/bin/bash
   cd /home/u519141514/domains/dadimulyo.my.id/public_html/api_backend
   composer install --no-dev --optimize-autoloader
   php artisan config:cache
   php artisan route:cache
   php artisan migrate --force

   cd /home/u519141514/domains/dadimulyo.my.id/public_html
   # jalankan build web/ lalu salin hasil dist/
   ```

3. **Pull untuk deploy**:
   ```bash
   cd api_backend && composer install --no-dev && php artisan migrate --force && php artisan config:cache
   ```

---

## Option C: Manual Upload (No CI/CD) — DIPAKAI SAAT INI

1. Build frontend lokal:
   ```bash
   cd web && npm ci && npm run build
   ```

2. Upload via SSH (dari folder repo lokal):
   - `web/dist/` contents → `/home/u519141514/domains/dadimulyo.my.id/public_html/`
   - Perubahan `backend/` (mis. `app/`, `routes/`) → `/home/u519141514/domains/dadimulyo.my.id/public_html/api_backend/`
   - **Jangan** meng-upload `vendor/`, `.env`, atau storage runtime.

3. Di server, jalankan:
   ```bash
   cd /home/u519141514/domains/dadimulyo.my.id/public_html/api_backend
   php artisan optimize:clear
   php artisan route:cache
   php artisan config:cache
   ```

---

## Deployment Checklist

- [ ] Frontend load di `https://dadimulyo.my.id`
- [ ] API respond di `https://dadimulyo.my.id/api/site-stats`
- [ ] Login admin berfungsi
- [ ] Listing truck & jeruk load
- [ ] Tidak ada CORS error di console browser
- [ ] SSL valid
- [ ] `dadimulyo.com` TIDAK dipakai (domain yang benar hanya `dadimulyo.my.id`)

---

## Catatan Penting

- **Domain benar**: `dadimulyo.my.id`. Jangan gunakan `dadimulyo.com` (tidak terdaftar / tidak resolve).
- Dokumen lama menyebut `dadimulyo.com` dan `u123456789` — itu hanya placeholder, bukan nilai aktual.
- Semua path produksi menggunakan `/home/u519141514/...` dan domain `dadimulyo.my.id`.