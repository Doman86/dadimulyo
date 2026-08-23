import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:device_info_plus/device_info_plus.dart';

import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'services/api_client.dart';
import 'widgets/app_theme.dart';
import 'screens/home/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Jalankan app langsung — splash screen tampil duluan
  runApp(const DadiMulyoApp());
}

/// Dipanggil dari splash screen setelah frame pertama render
Future<void> initializeApp() async {
  await _configureBaseUrl();
}

Future<void> _configureBaseUrl() async {
  // SERVER_IP bisa diisi via: flutter run --dart-define=SERVER_IP=192.168.1.x
  final serverIp = const String.fromEnvironment('SERVER_IP');

  try {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      final isEmulator = !androidInfo.isPhysicalDevice;

      if (isEmulator) {
        // Emulator Android: 10.0.2.2 adalah alias untuk localhost PC
        ApiClient.setBaseUrl('http://10.0.2.2:8000/api');
      } else {
        // HP fisik:
        // - Default 127.0.0.1 -> lewat kabel USB (adb reverse tcp:8000 tcp:8000)
        //   (script run_hp.bat sudah otomatis menjalankan adb reverse)
        // - Atau lewat WiFi: flutter run --dart-define=SERVER_IP=<IP_LAPTOP>
        ApiClient.setBaseUrl('http://${serverIp.isEmpty ? '127.0.0.1' : serverIp}:8000/api');
      }
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      final isEmulator = !iosInfo.isPhysicalDevice;

      if (isEmulator) {
        ApiClient.setBaseUrl('http://127.0.0.1:8000/api');
      } else {
        ApiClient.setBaseUrl('http://${serverIp.isEmpty ? '127.0.0.1' : serverIp}:8000/api');
      }
    }
  } catch (_) {
    ApiClient.setBaseUrl(
        'http://${serverIp.isEmpty ? '10.0.2.2' : serverIp}:8000/api');
  }
}

// ─── Splash Screen ───────────────────────────────────────────────

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    _startApp();
  }

  Future<void> _startApp() async {
    // Jalankan inisialisasi (device detection, base URL, dll)
    await initializeApp();

    // Tampilkan splash minimal 1.5 detik agar terasa
    await Future.delayed(const Duration(milliseconds: 1500));

    if (!mounted) return;

    // Navigate ke home screen
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 500),
        pageBuilder: (ctx, animation, secondaryAnimation) =>
            const _AppRoot(),
        transitionsBuilder: (ctx, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primaryDark,
              AppTheme.primary,
            ],
          ),
        ),
        child: FadeTransition(
          opacity: _fadeAnim,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo / Icon
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      '🚛',
                      style: TextStyle(fontSize: 48),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Brand Name
                RichText(
                  text: const TextSpan(children: [
                    TextSpan(
                      text: 'Dadi ',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    TextSpan(
                      text: 'Mulyo',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 8),

                // Tagline
                Text(
                  'Showroom Truck & Jeruk Segar',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),

                const SizedBox(height: 48),

                // Loading indicator
                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── App Root (setelah splash) ───────────────────────────────────

class _AppRoot extends StatelessWidget {
  const _AppRoot();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp(
        title: 'Dadi Mulyo',
        theme: AppTheme.theme,
        debugShowCheckedModeBanner: false,
        home: const HomeScreen(),
      ),
    );
  }
}

// ─── Entry Point ─────────────────────────────────────────────────

class DadiMulyoApp extends StatelessWidget {
  const DadiMulyoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dadi Mulyo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const SplashScreen(),
    );
  }
}
