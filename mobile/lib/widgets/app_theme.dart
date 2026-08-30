import 'package:flutter/material.dart';

class AppTheme {
  // Brand colors matching the web app (dark forest green + gold)
  static const Color primary = Color(0xFF14532D); // forest green
  static const Color primaryDark = Color(0xFF04150E); // near-black green
  static const Color forest = Color(0xFF0B2E1F);
  static const Color pine = Color(0xFF071F15);
  static const Color moss = Color(0xFF166534);
  static const Color primaryLight = Color(0xFF4CAF50);

  // Gold accent (replaces the old orange secondary)
  static const Color gold = Color(0xFFC9A227);
  static const Color goldLight = Color(0xFFE8C766);
  static const Color goldDeep = Color(0xFF9A7B1A);

  static const Color secondary = Color(0xFFC9A227);
  static const Color accent = Color(0xFFFFF3E0);

  // Neutrals (cream background to match web)
  static const Color surface = Color(0xFFF5F5F5);
  static const Color background = Color(0xFFFAF8F2); // cream
  static const Color backgroundAlt = Color(0xFFF1ECDF); // sand
  static const Color textPrimary = Color(0xFF1C2321);
  static const Color textSecondary = Color(0xFF757575);
  static const Color cardBg = Colors.white;

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryDark, forest, pine],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [goldLight, gold, goldDeep],
  );

  static ThemeData get theme {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      surface: background,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: luxuryPageTransition,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: textPrimary,
          letterSpacing: -0.5,
          height: 1.15,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: textPrimary,
          height: 1.2,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
        bodyMedium: TextStyle(fontSize: 14, color: textPrimary, height: 1.4),
        bodySmall: TextStyle(fontSize: 12.5, color: textSecondary, height: 1.4),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 6,
        centerTitle: true,
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(0)),
        ),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shadowColor: Colors.black26,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.black.withValues(alpha: 0.05)),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.black.withValues(alpha: 0.06),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: secondary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: gold, width: 1.5),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 11,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: primaryDark,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: backgroundAlt,
        selectedColor: gold,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: primary),
    );
  }

  /// Luxury page transition (slide + fade + subtle scale), dipakai app-wide.
  static const luxuryPageTransition = <TargetPlatform, PageTransitionsBuilder>{
    TargetPlatform.android: _LuxuryPageTransitionsBuilder(),
    TargetPlatform.iOS: _LuxuryPageTransitionsBuilder(),
    TargetPlatform.macOS: _LuxuryPageTransitionsBuilder(),
    TargetPlatform.windows: _LuxuryPageTransitionsBuilder(),
    TargetPlatform.linux: _LuxuryPageTransitionsBuilder(),
    TargetPlatform.fuchsia: _LuxuryPageTransitionsBuilder(),
  };

  static List<BoxShadow> luxuryShadow(double radius) => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: radius,
      offset: Offset(0, radius * 0.4),
    ),
  ];

  /// Gold gradient primary button (mewah).
  static Widget goldButton({
    required VoidCallback? onPressed,
    required String label,
    Widget? icon,
    bool loading = false,
    double? height,
  }) {
    return SizedBox(
      width: double.infinity,
      height: height ?? 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: goldGradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: gold.withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onPressed == null || loading ? null : onPressed,
            child: Center(
              child: loading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Color(0xFF241A02),
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[icon, const SizedBox(width: 10)],
                        Text(
                          label,
                          style: const TextStyle(
                            color: Color(0xFF241A02),
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  static String formatRupiah(double amount) {
    final formatted = amount.toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < formatted.length; i++) {
      if (i > 0 && (formatted.length - i) % 3 == 0) buffer.write('.');
      buffer.write(formatted[i]);
    }
    return 'Rp $buffer';
  }

  static String formatNumber(double number) {
    if (number == number.toInt().toDouble()) {
      return number.toInt().toString();
    }
    return number.toStringAsFixed(1);
  }
}

/// Page transition mewah: slide + fade + subtle scale untuk seluruh navigasi.
class _LuxuryPageTransitionsBuilder extends PageTransitionsBuilder {
  const _LuxuryPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0.07, 0.03),
        end: Offset.zero,
      ).animate(curved),
      child: FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.985, end: 1.0).animate(curved),
          child: child,
        ),
      ),
    );
  }
}
