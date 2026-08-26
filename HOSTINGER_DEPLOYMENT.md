# DADI MULYO — HOSTINGER DEPLOYMENT GUIDE

## Architecture

```
dadimulyo.com          → React SPA (web/dist/)
api.dadimulyo.com      → Laravel API (backend/)
dadimulyo_db           → MySQL database (Hostinger)
```

**Split-domain architecture**: Frontend on the main domain, API on a subdomain. This is the recommended setup for shared hosting because:
- Laravel `public/` becomes the API subdomain document root
- React `dist/` becomes the main domain document root
- No directory conflicts between PHP and static files
- CORS is configured once between the two domains

---

## Prerequisites

- [ ] Hostinger hosting account (shared hosting plan)
- [ ] Domain `dadimulyo.com` (or your chosen domain) configured in Hostinger
- [ ] Subdomain `api.dadimulyo.com` created in Hostinger panel
- [ ] MySQL database created in Hostinger panel
- [ ] PHP 8.3+ enabled (Hostinger usually defaults to 8.1+)
- [ ] SSH access (optional but recommended)

---

## Step 1: Create Hostinger Resources

### Database
1. Hostinger Panel → Databases → MySQL
2. Create database: `u123456789_dadimulyo` (prefix varies by account)
3. Create database user with full privileges
4. Note: hostname, username, password

### Subdomain
1. Hostinger Panel → Domains → Subdomains
2. Create: `api.dadimulyo.com`
3. Set document root to: `/home/u123456789/domains/api.dadimulyo.com/public_html`

---

## Step 2: Upload Backend

### Via File Manager or SSH:
```bash
# From your local machine
cd backend

# Upload everything EXCEPT:
# - vendor/
# - node_modules/
# - .env (will be created on server)
# - storage/logs/*
# - storage/framework/cache/*
```

### Via SSH (recommended):
```bash
ssh u123456789@server.dadimulyo.com
cd /home/u123456789/domains/api.dadimulyo.com/public_html

# Upload files, then:
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

---

## Step 3: Configure Backend .env

Edit `backend/.env` on the server:

```env
APP_NAME="Dadi Mulyo"
APP_ENV=production
APP_KEY=base64:generated_key_here
APP_DEBUG=false
APP_URL=https://api.dadimulyo.com

APP_LOCALE=id
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_dadimulyo
DB_USERNAME=u123456789_dbuser
DB_PASSWORD=your_db_password_here

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=.dadimulyo.com

FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log

SANCTUM_STATEFUL_DOMAINS=dadimulyo.com,api.dadimulyo.com
FRONTEND_URL=https://dadimulyo.com
```

---

## Step 4: Run Migrations & Seed

```bash
cd /home/u123456789/domains/api.dadimulyo.com/public_html
php artisan migrate --force
php artisan db:seed --force    # First deploy only
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 5: Upload Frontend

Build locally first:
```bash
cd web
npm ci
npm run build
```

Upload `web/dist/` contents to the main domain document root:
```
/home/u123456789/domains/dadimulyo.com/public_html/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── favicon.svg
└── .htaccess
```

**Important**: Upload the `.htaccess` file from `web/public/` — it handles SPA routing (rewrites all paths to `index.html`).

---

## Step 6: Domain Configuration

### Main domain (dadimulyo.com)
- Document root: `/home/u123456789/domains/dadimulyo.com/public_html`
- SSL: Enable in Hostinger panel (free Let's Encrypt)

### API subdomain (api.dadimulyo.com)
- Document root: `/home/u123456789/domains/api.dadimulyo.com/public_html`
- SSL: Enable in Hostinger panel
- **Point to `backend/public/`** — this is critical

---

## Step 7: Laravel public/ Directory

The API subdomain document root MUST be `backend/public/`. If Hostinger doesn't allow changing the document root to a subdirectory, create a symbolic link or `.htaccess` redirect:

**Option A**: Set document root to `backend/` and add to `backend/.htaccess`:
```apache
RewriteEngine On
RewriteRule ^(.*)$ public/$1 [L]
```

**Option B**: Set document root to `backend/public/` directly (preferred).

---

## Step 8: File Permissions

```bash
chmod -R 775 storage bootstrap/cache
chmod -R 775 public/storage    # If storage:link created
```

---

## Step 9: Verify

1. Visit `https://dadimulyo.com` — should load React SPA
2. Visit `https://api.dadimulyo.com/up` — should return `{"status":"ok"}`
3. Visit `https://api.dadimulyo.com/api/trucks` — should return JSON
4. Login: `admin@dadimulyo.com` / `password` (change after first login!)

---

## Environment Variables Reference

### Backend (.env)
| Variable | Production Value |
|----------|-----------------|
| APP_ENV | production |
| APP_DEBUG | false |
| APP_URL | https://api.dadimulyo.com |
| DB_HOST | localhost (Hostinger DB) |
| DB_DATABASE | u123456789_dadimulyo |
| DB_USERNAME | u123456789_dbuser |
| DB_PASSWORD | (from Hostinger panel) |
| SESSION_DOMAIN | .dadimulyo.com |
| SANCTUM_STATEFUL_DOMAINS | dadimulyo.com |
| FRONTEND_URL | https://dadimulyo.com |

### Frontend
| Variable | Value |
|----------|-------|
| VITE_API_URL | /api (relative, if proxied) or https://api.dadimulyo.com/api |

**Note**: The frontend `.env.production` uses `VITE_API_URL=/api`. If the API is on a separate subdomain, you need to either:
- **Option A**: Set `VITE_API_URL=https://api.dadimulyo.com/api` in `.env.production` and rebuild
- **Option B**: Add a proxy rewrite on the main domain `.htaccess`:
  ```apache
  RewriteCond %{HTTP_HOST} ^dadimulyo\.com$ [NC]
  RewriteRule ^api/(.*)$ https://api.dadimulyo.com/api/$1 [L,R=301]
  ```
- **Option C** (Recommended): Keep relative `/api` and configure Apache/Nginx reverse proxy on the main domain to proxy `/api/*` to the API subdomain.

---

## Troubleshooting

### CORS errors
- Verify `FRONTEND_URL=https://dadimulyo.com` in backend `.env`
- Verify `SANCTUM_STATEFUL_DOMAINS=dadimulyo.com` in backend `.env`
- Clear cache: `php artisan config:clear && php artisan config:cache`

### 404 on API routes
- Verify document root points to `backend/public/`
- Check `.htaccess` exists in `backend/public/`
- Enable mod_rewrite: Hostinger panel → Apache → mod_rewrite

### Blank page on frontend
- Verify `.htaccess` exists in the main domain document root
- Check browser console for asset loading errors
- Verify all assets from `dist/` are uploaded

### Database connection refused
- Verify DB credentials match Hostinger panel
- Hostinger MySQL host is usually `localhost`
- Check `php artisan tinker` → `DB::connection()->getPdo()`

### Storage/Image not loading
- Run `php artisan storage:link`
- Verify `storage/app/public` is writable
- Check symlink: `ls -la public/storage`
