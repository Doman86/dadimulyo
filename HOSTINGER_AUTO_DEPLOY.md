# DADI MULYO — AUTOMATIC DEPLOYMENT (GitHub → Hostinger)

## Option A: GitHub Actions + Hostinger SSH (Recommended)

### Setup

1. **Enable SSH in Hostinger**:
   - Hostinger Panel → Advanced → SSH Access
   - Note the SSH host, port, and username

2. **Add GitHub Secrets**:
   Go to GitHub repo → Settings → Secrets and variables → Actions

   | Secret | Value |
   |--------|-------|
   | `HOSTINGER_SSH_HOST` | server.dadimulyo.com |
   | `HOSTINGER_SSH_USER` | u123456789 |
   | `HOSTINGER_SSH_KEY` | (private SSH key contents) |
   | `HOSTINGER_SSH_PORT` | 65002 |
   | `HOSTINGER_BACKEND_PATH` | /home/u123456789/domains/api.dadimulyo.com/public_html |
   | `HOSTINGER_FRONTEND_PATH` | /home/u123456789/domains/dadimulyo.com/public_html |

3. **Generate SSH key pair** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
   # Add deploy_key.pub to Hostinger: ~/.ssh/authorized_keys
   # Add deploy_key contents to GitHub Secrets as HOSTINGER_SSH_KEY
   ```

### Workflow

Push to `main` → GitHub Actions runs:
1. **Build** backend (`composer install --no-dev`) and frontend (`npm run build`)
2. **Upload** via rsync/scp to Hostinger
3. **Deploy** run migrations, cache configs, set permissions

### Manual Trigger

```bash
# Push to main to trigger automatic deployment
git push origin main
```

---

## Option B: Git Pull on Hostinger

If Hostinger supports Git:

1. **Initialize Git on Hostinger**:
   ```bash
   # SSH into Hostinger
   cd /home/u123456789/domains/api.dadimulyo.com/public_html
   git init
   git remote add origin https://github.com/Doman86/dadimulyo.git
   git fetch origin main
   git checkout main
   ```

2. **Post-pull hook** (create `post-pull.sh`):
   ```bash
   #!/bin/bash
   cd /home/u123456789/domains/api.dadimulyo.com/public_html/backend
   composer install --no-dev --optimize-autoloader
   php artisan config:cache
   php artisan route:cache
   php artisan migrate --force

   cd /home/u123456789/domains/api.dadimulyo.com/public_html/web
   npm ci
   npm run build
   ```

3. **Pull to deploy**:
   ```bash
   cd backend && composer install --no-dev && php artisan migrate --force && php artisan config:cache
   ```

---

## Option C: Manual Upload (No CI/CD)

1. Run build script locally:
   ```bash
   bash scripts/build-production.sh
   ```

2. Upload via Hostinger File Manager:
   - `backend/` contents → API subdomain document root
   - `web/dist/` contents → Main domain document root

3. On server, run:
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env   # Edit with production values
   php artisan key:generate
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache
   php artisan route:cache
   ```

---

## Deployment Checklist

After every deployment:

- [ ] Frontend loads at `https://dadimulyo.com`
- [ ] API responds at `https://api.dadimulyo.com/up`
- [ ] Login works (`admin@dadimulyo.com`)
- [ ] Truck listing loads
- [ ] Orange listing loads
- [ ] Cart functionality works
- [ ] Orders can be created
- [ ] File uploads work (truck/orange images)
- [ ] No CORS errors in browser console
- [ ] SSL certificate valid on both domains
