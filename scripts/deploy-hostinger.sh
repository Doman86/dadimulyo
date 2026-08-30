#!/usr/bin/env bash
# ============================================================
# Dadi Mulyo — Hostinger Deployment Script
# Run ON the Hostinger server after files are uploaded
# ============================================================
set -euo pipefail

# Adjust these paths to match your Hostinger setup
BACKEND_DIR="${BACKEND_DIR:-/home/u519141514/domains/dadimulyo.my.id/public_html/api_backend}"
FRONTEND_DIR="${FRONTEND_DIR:-/home/u519141514/domains/dadimulyo.my.id/public_html}"

echo "============================================"
echo "  DADI MULYO — HOSTINGER DEPLOY"
echo "============================================"

# ---- BACKEND ----
echo ""
echo "[1/5] Setting up backend..."
cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  → Created .env from .env.example"
    echo "  → IMPORTANT: Edit .env with your production values!"
fi

echo "[2/5] Generating APP_KEY (if empty)..."
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null || grep "APP_KEY=base64:" .env | grep -q "base64:$" ; then
    php artisan key:generate --force
    echo "  → APP_KEY generated"
fi

echo "[3/5] Running database migrations..."
php artisan migrate --force

echo "[4/5] Seeding database (first deploy only)..."
echo "  → Run manually: php artisan db:seed --force"
echo "  → Skip if database already has data"

echo "[5/5] Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R $(whoami):$(whoami) storage bootstrap/cache
php artisan storage:link --force 2>/dev/null || true

echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "Backend API:  https://dadimulyo.my.id/api"
echo "Frontend:     https://dadimulyo.my.id"
echo ""
echo "POST-DEPLOY CHECKLIST:"
echo "  1. Edit backend/.env with production DB credentials"
echo "  2. Set SANCTUM_STATEFUL_DOMAINS=dadimulyo.my.id"
echo "  3. Set FRONTEND_URL=https://dadimulyo.my.id"
echo "  4. Set APP_URL=https://dadimulyo.my.id"
echo "  5. Set APP_DEBUG=false"
echo "  6. Run: php artisan db:seed --force (first deploy)"
echo "  7. Verify: php artisan route:list"
