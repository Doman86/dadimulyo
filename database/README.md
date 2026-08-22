# database/

Folder ini menampung artefak database: dump SQL, backup skema, dan diagram ERD.

- Skema lengkap didefinisikan di `backend/database/migrations` (source of truth teknis).
- Deskripsi tabel & kolom: `docs/04-database.json`.
- Migrasi: `php artisan migrate` (dari folder `backend/`).
