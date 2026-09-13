# Dadi Mulyo Mobile

Aplikasi mobile **Dadi Mulyo — Showroom Truck & Marketplace Jeruk** (Flutter).

## Rilis v1.1.1

- Perbaiki splash screen rendering (bug child hilang dari AnimatedBuilder)
- Test widget ditambahkan: splash render konten & navigasi ke HomeScreen
- Build release APK berhasil (55.9MB)
- Analisis kode (flutter analyze): 0 issue
- Lompat versi: 1.1.0+2 → 1.1.1+3

## Prasyarat

- Flutter stable (project ini dibuat dengan Flutter 3.44 / Dart 3.12)
- Android SDK + Java 17 (untuk build Android)
- Keystore release: file `upload-keystore.jks` di luar repo (mis. `C:\Users\<user>\upload-keystore.jks`)

## Setup API

Base URL API ditentukan dengan urutan prioritas:

1. `--dart-define=API_BASE_URL=...` (override penuh)
2. `--dart-define=SERVER_IP=<ip-laptop>` (development via Wi-Fi, port 8000)
3. Fallback produksi: `https://dadimulyo.my.id/api` — **default build release langsung siap pakai**

## Jalankan (development)

```bash
flutter pub get

# Emulator Android (API lokal via adb reverse / 10.0.2.2)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api

# HP fisik via Wi-Fi ke laptop
flutter run --dart-define=SERVER_IP=192.168.1.100
```

## Build Release (Android)

1. Pastikan `android/key.properties` ada dan menunjuk ke keystore:

   ```properties
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=C:\\Users\\<user>\\upload-keystore.jks
   ```

2. Bump versi di `pubspec.yaml` (`version: 1.1.1+3` — nama+build number) bila mau mengirim update.

3. Build:

   ```bash
   # APK (instal langsung / distribusi)
   flutter build apk --release

   # App Bundle (wajib untuk Google Play)
   flutter build appbundle --release
   ```

   Hasil: `build/app/outputs/flutter-apk/app-release.apk`
   atau `build/app/outputs/bundle/release/app-release.aab`

Build release otomatis:
- Ter-sign dengan keystore release dari `key.properties`
- HTTPS only (network security config menolak cleartext HTTP)
- Fallback API ke `https://dadimulyo.my.id/api`
- Heap Gradle dibatasi 2 GB (aman untuk mesin RAM 8 GB; default 8G pernah
  menyebabkan `java.lang.OutOfMemoryError` saat `assembleRelease`)

## Catatan Firebase

Konfigurasi ada di `lib/firebase_options.dart` + `android/app/google-services.json`.
Push notification (FCM) aktif di Android/iOS. Jika project Firebase berubah,
generate ulang dengan `flutterfire configure`.

## Struktur

```
lib/
├── config/       # AppConfig (kontak, alamat, aturan bisnis)
├── models/       # Model data (Order, Truck, Driver, dll)
├── providers/    # State (auth, cart)
├── screens/      # UI per fitur
├── services/     # ApiClient, notification, PDF invoice
└── widgets/      # Theme & komponen reusable
```

> Folder `admin/` (dashboard web Flutter) dan `landing/` berada di dalam repo ini
> tetapi terkelola terpisah — jangan dibuild lewat project mobile ini.

## Prasyarat

- Flutter stable (project ini dibuat dengan Flutter 3.44 / Dart 3.12)
- Android SDK + Java 17 (untuk build Android)
- Keystore release: file `upload-keystore.jks` di luar repo (mis. `C:\Users\<user>\upload-keystore.jks`)

## Setup API

Base URL API ditentukan dengan urutan prioritas:

1. `--dart-define=API_BASE_URL=...` (override penuh)
2. `--dart-define=SERVER_IP=<ip-laptop>` (development via Wi-Fi, port 8000)
3. Fallback produksi: `https://dadimulyo.my.id/api` — **default build release langsung siap pakai**

## Jalankan (development)

```bash
flutter pub get

# Emulator Android (API lokal via adb reverse / 10.0.2.2)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api

# HP fisik via Wi-Fi ke laptop
flutter run --dart-define=SERVER_IP=192.168.1.100
```

## Build Release (Android)

1. Pastikan `android/key.properties` ada dan menunjuk ke keystore:

   ```properties
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=C:\\Users\\<user>\\upload-keystore.jks
   ```

2. Bump versi di `pubspec.yaml` (`version: 1.0.1+2` — nama+build number) bila mau mengirim update.

3. Build:

   ```bash
   # APK (instal langsung / distribusi)
   flutter build apk --release

   # App Bundle (wajib untuk Google Play)
   flutter build appbundle --release
   ```

   Hasil: `build/app/outputs/flutter-apk/app-release.apk`
   atau `build/app/outputs/bundle/release/app-release.aab`

Build release otomatis:
- Ter-sign dengan keystore release dari `key.properties`
- HTTPS only (network security config menolak cleartext HTTP)
- Fallback API ke `https://dadimulyo.my.id/api`
- Heap Gradle dibatasi 2 GB (aman untuk mesin RAM 8 GB; default 8G pernah
  menyebabkan `java.lang.OutOfMemoryError` saat `assembleRelease`)

## Catatan Firebase

Konfigurasi ada di `lib/firebase_options.dart` + `android/app/google-services.json`.
Push notification (FCM) aktif di Android/iOS. Jika project Firebase berubah,
generate ulang dengan `flutterfire configure`.

## Struktur

```
lib/
├── config/       # AppConfig (kontak, alamat, aturan bisnis)
├── models/       # Model data (Order, Truck, Driver, dll)
├── providers/    # State (auth, cart)
├── screens/      # UI per fitur
├── services/     # ApiClient, notification, PDF invoice
└── widgets/      # Theme & komponen reusable
```

> Folder `admin/` (dashboard web Flutter) dan `landing/` berada di dalam repo ini
> tetapi terkelola terpisah — jangan dibuild lewat project mobile ini.
