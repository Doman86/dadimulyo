#!/bin/bash
# Script deploy web ke production

cd web

# 1. Simpan .env lokal (untuk development)
if [ -f .env.local.backup ]; then
    cp .env.local.backup .env
fi

# 2. Build untuk production dengan VITE_API_URL=/api
echo "VITE_API_URL=/api" > .env
echo "VITE_BULK_THRESHOLD_KG=50" >> .env

npm run build

# 3. Kembalikan .env lokal
if [ -f .env.local.backup ]; then
    cp .env.local.backup .env
    rm .env.local.backup
fi

echo "Build selesai! Folder dist/ siap diupload ke server."
