/// Centralized configuration for Dadi Mulyo mobile app.
/// Semua nilai bisnis (kontak, alamat, dll) diatur di sini.
/// Jangan hardcode di UI — import class ini sebagai gantinya.
class AppConfig {
  AppConfig._();

  // ─── Company Info ─────────────────────────────────────────────
  static const String companyName = 'Dadi Mulyo';
  static const String companyShortName = 'DM';

  // ─── Contact ──────────────────────────────────────────────────
  static const String contactPhone = '0813-1308-5905';
  static const String contactPhoneDigits = '6281313085905'; // internasional
  static const String contactEmail = 'info@dadimulyo.my.id';

  // ─── Address ──────────────────────────────────────────────────
  static const String addressStreet = 'Wagir, Kab. Malang';
  static const String addressCity = 'Malang';
  static const String addressProvince = 'Jawa Timur';
  static const String addressFull = 'Wagir, Kabupaten Malang, Jawa Timur';
  static const String addressShort = 'Wagir · Kabupaten Malang';

  // ─── Links ────────────────────────────────────────────────────
  static String get whatsappUrl =>
      'https://wa.me/$contactPhoneDigits';
  static String get mapsUrl =>
      'https://maps.google.com/?q=Wagir+Malang+Jawa+Timur';

  // ─── Business Rules ──────────────────────────────────────────
  static const double bulkThresholdKg = 50;
}
