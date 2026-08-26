#!/usr/bin/env bash
# ============================================================
# Dadi Mulyo — Production Build Script
# Run this before deploying to Hostinger
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  DADI MULYO — PRODUCTION BUILD"
echo "============================================"

# ---- BACKEND ----
echo ""
echo "[1/4] Installing PHP dependencies (production)..."
cd "$ROOT/backend"
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

echo "[2/4] Clearing & caching Laravel config..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# ---- FRONTEND ----
echo ""
echo "[3/4] Installing Node dependencies..."
cd "$ROOT/web"
npm ci --ignore-scripts

echo "[4/4] Building React frontend..."
npm run build

echo ""
echo "============================================"
echo "  BUILD COMPLETE"
echo "============================================"
echo ""
echo "Backend ready at:  $ROOT/backend/"
echo "Frontend ready at: $ROOT/web/dist/"
echo ""
echo "Next: upload backend/ and web/dist/ to Hostinger"
echo "See HOSTINGER_DEPLOYMENT.md for full instructions."
