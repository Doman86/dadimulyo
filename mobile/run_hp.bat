@echo off
setlocal
title Dadi Mulyo - Run di HP (via Kabel USB)

REM ============================================================
REM  Script otomatis untuk debug app di HP fisik lewat KABEL USB
REM  Cara pakai: tinggal double-click file ini
REM  (HP harus tercolok kabel USB ke PC + USB Debugging aktif)
REM ============================================================

set ADB=D:\android_sdk\platform-tools\adb.exe

if not exist "%ADB%" (
    echo [ERROR] adb.exe tidak ditemukan di: %ADB%
    pause
    exit /b 1
)

echo.
echo ============================================
echo   DADI MULYO - Run di HP via Kabel USB
echo ============================================
echo.

echo [1/4] Mengecek HP terhubung...
"%ADB%" start-server >nul 2>&1

set FOUND=0
for /f "skip=1 tokens=1,2" %%a in ('%ADB% devices') do (
    if "%%b"=="device" set FOUND=1
)

if "%FOUND%"=="0" goto :no_device

echo       OK - HP terdeteksi:
"%ADB%" devices -l | findstr /C:"device:"
echo.

echo [2/4] Mengaktifkan port forwarding USB (adb reverse)...
"%ADB%" reverse --remove-all >nul 2>&1
"%ADB%" reverse tcp:8000 tcp:8000 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan adb reverse.
    echo         Coba cabut-pasang kabel USB lalu jalankan lagi.
    pause
    exit /b 1
)
echo       OK - HP bisa akses backend PC via http://127.0.0.1:8000
echo.

echo [3/4] Mengecek backend Laravel di localhost:8000...
set HTTP_CODE=000
for /f %%i in ('curl -s -o nul -w "%%{http_code}" -m 5 http://localhost:8000/api/trucks 2^>nul') do set HTTP_CODE=%%i
if "%HTTP_CODE%"=="000" (
    echo.
    echo [!] PERINGATAN: Backend tidak merespon di http://localhost:8000
    echo     App tetap akan dijalankan, tapi data tidak akan muncul.
    echo     Jalankan backend dulu di folder backend:
    echo        php artisan serve --port=8000
    echo.
) else (
    echo       OK - Backend merespon (HTTP %HTTP_CODE%)
)
echo.

echo [4/4] Build dan jalankan app di HP...
echo       (Proses pertama agak lama, tunggu sampai selesai build)
echo.
cd /d "%~dp0"
flutter run --dart-define=SERVER_IP=127.0.0.1
goto :end

:no_device
echo.
echo [!] TIDAK ADA HP YANG TERDETEKSI. Cek langkah berikut:
echo.
echo     1. Pastikan kabel USB tercolok ke PC dan HP
echo        (pakai kabel data, bukan kabel charge saja)
echo.
echo     2. Aktifkan mode "Transfer file / MTP" di notifikasi HP
echo.
echo     3. Aktifkan USB Debugging di HP:
echo        - Buka Setelan ^> Tentang ponsel
echo        - Ketuk "Nomor bentukan / Build number" 7x sampai
echo          muncul "Anda sekarang menjadi pengembang"
echo        - Kembali ke Setelan ^> Sistem ^> Opsi pengembang
echo        - Aktifkan "Debugging USB"
echo.
echo     4. Saat kabel dipasang, di layar HP akan muncul popup:
echo        "Izinkan debugging USB?" -&gt; centang selalu &gt; pilih IZINKAN
echo.
echo     5. Cabut pasang kabel, lalu jalankan script ini lagi.
echo.
echo Status deteksi saat ini:
"%ADB%" devices
echo.
pause
exit /b 1

:end
echo.
echo App berhenti atau koneksi putus? Cek pesan di atas.
pause
