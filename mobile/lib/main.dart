import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:device_info_plus/device_info_plus.dart';

import 'config/app_config.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'services/api_client.dart';
import 'widgets/app_theme.dart';
import 'widgets/animations.dart';
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
        ApiClient.setBaseUrl('http://10.0.2.2:8000/api');  // dart-define: API_BASE_URL
      } else {
        // HP fisik:
        // - Default 127.0.0.1 -> lewat kabel USB (adb reverse tcp:8000 tcp:8000)
        //   (script run_hp.bat sudah otomatis menjalankan adb reverse)
        // - Atau lewat WiFi: flutter run --dart-define=SERVER_IP=<IP_LAPTOP>
        ApiClient.setBaseUrl(
          'http://${serverIp.isEmpty ? '127.0.0.1' : serverIp}:8000/api',
        );
      }
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      final isEmulator = !iosInfo.isPhysicalDevice;

      if (isEmulator) {
        ApiClient.setBaseUrl('http://127.0.0.1:8000/api');
      } else {
        ApiClient.setBaseUrl(
          'http://${serverIp.isEmpty ? '127.0.0.1' : serverIp}:8000/api',
        );
      }
    }
  } catch (_) {
    ApiClient.setBaseUrl(
      'http://${serverIp.isEmpty ? '10.0.2.2' : serverIp}:8000/api',
    );
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

    _fadeAnim = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    _scaleAnim = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

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
        pageBuilder: (ctx, animation, secondaryAnimation) => const _AppRoot(),
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
      body: AnimatedGradientBackground(
        phases: const [
          [AppTheme.primaryDark, AppTheme.primary],
          [Color(0xFF0B3D26), AppTheme.primaryDark],
          [AppTheme.forest, AppTheme.primary],
        ],
        period: const Duration(seconds: 5),
        child: Stack(
          children: [
            const Positioned.fill(
              child: FloatingOrbs(
                orbColors: [AppTheme.gold],
                maxDrift: 26,
                opacity: 0.30,
              ),
            ),
            Center(
              child: FadeTransition(
                opacity: _fadeAnim,
                child: ScaleTransition(
                  scale: _scaleAnim,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo emas berkerlip
                      Shimmer(
                        child: Container(
                          width: 104,
                          height: 104,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.gold.withValues(alpha: 0.45),
                                blurRadius: 32,
                                spreadRadius: 2,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text('🚛', style: TextStyle(fontSize: 50)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Brand Name
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: '${AppConfig.companyName.split(' ')[0]} ',
                              style: const TextStyle(
                                fontSize: 34,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.4,
                              ),
                            ),
                            TextSpan(
                              text: AppConfig.companyName.split(' ').length > 1
                                  ? AppConfig.companyName.split(' ')[1]
                                  : '',
                              style: const TextStyle(
                                fontSize: 34,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.goldLight,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Tagline animated shimmer
                      Shimmer(
                        baseColor: const Color(0xFF9FB7A8),
                        highlightColor: const Color(0xFFF3E2B4),
                        child: const Text(
                          'Showroom Truck & Jeruk Segar',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white,
                            letterSpacing: 3,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                      const SizedBox(height: 54),

                      // Loading indicator emas
                      SizedBox(
                        width: 26,
                        height: 26,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.8,
                          color: AppTheme.goldLight.withValues(alpha: 0.9),
                          backgroundColor: Colors.white10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
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
        title: AppConfig.companyName,
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
      title: AppConfig.companyName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const SplashScreen(),
    );
  }
}
