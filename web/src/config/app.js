// ============================================================
// APP CONFIGURATION — Dadi Mulyo Web
// Semua konfigurasi bisnis diatur di sini.
// Import dari file ini untuk menghindari hardcoded values.
// ============================================================

// Ambang batas grosir (harus sama dengan backend OrderController::BULK_THRESHOLD_KG)
export const BULK_THRESHOLD_KG = Number(import.meta.env.VITE_BULK_THRESHOLD_KG || 50);

// Company info (import dari site.js jika sudah ada)
export const COMPANY_NAME = 'Dadi Mulyo';
