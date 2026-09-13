// Smoke test: memastikan app merender dengan normal (tidak blank/putih).
//
// Regression test untuk bug blank screen: AnimatedGradientBackground
// tidak meneruskan `child` ke AnimatedBuilder, sehingga seluruh konten
// splash screen (dan header home) tidak pernah dirender.
//
// Alur test:
// 1. Splash screen harus menampilkan konten (logo & tagline).
// 2. Setelah delay splash, navigasi ke HomeScreen harus terjadi
//    (tab "Beranda" tampil di bottom nav).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dadi_mulyo_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Splash renders content — app is not blank', (WidgetTester tester) async {
    await tester.pumpWidget(const DadiMulyoApp());
    await tester.pump(const Duration(milliseconds: 100));

    // Konten splash harus tampil (bug blank: child hilang dari tree).
    expect(find.text('🚛'), findsOneWidget);
    expect(find.text('Showroom Truck & Jeruk Segar'), findsOneWidget);

    // Selesaikan timer splash sebelum test berakhir agar invariant
    // flutter_test (tidak boleh ada timer pending) terpenuhi.
    await tester.pump(const Duration(seconds: 2));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  });

  testWidgets('Splash navigates to HomeScreen', (WidgetTester tester) async {
    await tester.pumpWidget(const DadiMulyoApp());
    await tester.pump(const Duration(milliseconds: 100));

    // Lewati delay splash (1.5s) + durasi transisi (0.5s).
    await tester.pump(const Duration(seconds: 2));
    await tester.pump(const Duration(milliseconds: 600));

    // Beri kesempatan async nyata (pref auth, network call yang akan
    // gagal & ditangkap try/catch) selesai.
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100)));
    await tester.pump();

    // HomeScreen tampil: label tab bottom nav terlihat.
    expect(find.text('Beranda'), findsWidgets);

    // Unmount tree agar timer periodik nav carousel di-dispose
    // (flutter_test melarang timer pending saat test selesai).
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  });
}
