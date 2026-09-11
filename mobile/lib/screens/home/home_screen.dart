import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../models/truck.dart';
import '../../models/orange_product.dart';
import '../../services/api_client.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/animations.dart';
import '../../widgets/shared_widgets.dart';
import '../../widgets/luxury_bottom_nav.dart';
import '../trucks/truck_list_screen.dart';
import '../trucks/truck_detail_screen.dart';
import '../oranges/orange_list_screen.dart';
import '../oranges/orange_detail_screen.dart';
import '../rental/rental_screen.dart';
import '../cart/cart_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final _api = ApiClient();
  List<Truck> _trucks = [];
  List<OrangeProduct> _oranges = [];
  bool _loading = true;

  final PageController _truckCarousel = PageController(viewportFraction: 0.88);
  int _truckPage = 0;
  Timer? _truckTimer;

  @override
  void initState() {
    super.initState();
    _loadData();
    _truckTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted || _trucks.isEmpty || _currentIndex != 0) return;
      final next = (_truckPage + 1) % _trucks.length;
      _truckCarousel.animateToPage(
        next,
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    _truckCarousel.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final truckResult = await _api.getTrucks({'per_page': 6});
      final orangeResult = await _api.getOranges({
        'per_page': 6,
        'in_stock': 1,
      });
      setState(() {
        _trucks =
            (truckResult['data']?['data'] as List?)
                ?.map((e) => Truck.fromJson(e))
                .toList() ??
            [];
        _oranges =
            (orangeResult['data']?['data'] as List?)
                ?.map((e) => OrangeProduct.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _buildHomePage(),
      const TruckListScreen(),
      const RentalScreen(),
      const OrangeListScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: LuxuryBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          LuxNavItem(
            icon: Icons.home_outlined,
            activeIcon: Icons.home,
            label: 'Beranda',
          ),
          LuxNavItem(
            icon: Icons.local_shipping_outlined,
            activeIcon: Icons.local_shipping,
            label: 'Truck',
          ),
          LuxNavItem(
            icon: Icons.calendar_today_outlined,
            activeIcon: Icons.calendar_today,
            label: 'Sewa',
          ),
          LuxNavItem(
            icon: Icons.local_grocery_store_outlined,
            activeIcon: Icons.local_grocery_store,
            label: 'Jeruk',
          ),
          LuxNavItem(
            icon: Icons.person_outline,
            activeIcon: Icons.person,
            label: 'Profil',
          ),
        ],
      ),
    );
  }

  // ─────────────────────────── B E R A N D A ───────────────────────────

  Widget _buildHomePage() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.gold,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _buildHero()),
          _sectionHeader(
            title: 'Truck Terbaru',
            subtitle: 'Pilihan truck berkualitas — baru & bekas.',
            onSeeAll: () => setState(() => _currentIndex = 1),
          ),
          _buildTruckCarousel(),
          _sectionHeader(
            title: 'Jeruk Pilihan',
            subtitle: 'Jeruk segar langsung dari kebun ${AppConfig.addressCity}.',
            onSeeAll: () => setState(() => _currentIndex = 3),
          ),
          _buildOrangeRow(),
          SliverToBoxAdapter(child: _buildWhySection()),
          SliverToBoxAdapter(child: _buildCtaBand()),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  // ── Header ──
  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 6, 8, 0),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '${AppConfig.companyName.split(' ')[0]} ',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      fontSize: 20,
                      letterSpacing: 0.3,
                    ),
                  ),
                  TextSpan(
                    text: AppConfig.companyName.split(' ')[1],
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldLight,
                      fontSize: 20,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          Consumer<CartProvider>(
            builder: (ctx, cart, _) {
              final count = cart.items.length;
              return IconButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CartScreen()),
                ),
                icon: Badge(
                  isLabelVisible: count > 0,
                  label: Text('$count'),
                  backgroundColor: AppTheme.gold,
                  textColor: const Color(0xFF241A02),
                  child: const Icon(
                    Icons.shopping_bag_outlined,
                    color: Colors.white,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Hero (band atas + hero) ──
  Widget _buildHero() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primaryDark, AppTheme.primary, AppTheme.forest],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTopBar(),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 30),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RevealFade(
                    delayMs: 80,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: AppTheme.goldLight.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.eco_outlined,
                            size: 14,
                            color: AppTheme.goldLight,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            AppConfig.addressShort.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10.5,
                              letterSpacing: 1.1,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.goldLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  RevealFade(
                    delayMs: 160,
                    offset: const Offset(0, 0.05),
                    child: const Text.rich(
                      TextSpan(
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.15,
                          letterSpacing: -0.4,
                        ),
                        children: [
                          TextSpan(text: 'Showroom Truck &\n'),
                          TextSpan(
                            text: 'Jeruk Segar',
                            style: TextStyle(color: AppTheme.goldLight),
                          ),
                          TextSpan(text: ' Premium'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  RevealFade(
                    delayMs: 240,
                    child: Text(
                      '${AppConfig.companyName} melayani penjualan & penyewaan truck, plus marketplace jeruk berkualitas langsung dari kebun.',
                      style: TextStyle(
                        fontSize: 13.5,
                        color: Colors.white.withValues(alpha: 0.78),
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  RevealFade(
                    delayMs: 320,
                    child: Row(
                      children: [
                        Expanded(
                          child: _heroGoldButton(
                            label: 'Lihat Truck',
                            icon: Icons.local_shipping,
                            onTap: () => setState(() => _currentIndex = 1),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _heroGlassButton(
                            label: 'Beli Jeruk',
                            icon: Icons.shopping_bag_outlined,
                            onTap: () => setState(() => _currentIndex = 3),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  _heroStats(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _heroStats() {
    return Row(
      children: [
        _stat(150, '+', 'Truck Terjual'),
        _dividerDot(),
        _stat(500, '+', 'Klien Puas'),
        _dividerDot(),
        _stat(10, '+', 'Tahun Pengalaman'),
      ],
    );
  }

  Widget _stat(double value, String suffix, String label) {
    return Expanded(
      child: Column(
        children: [
          ReelAnimatedCounter(
            value: value,
            builder: (v) => Text(
              '${v.toStringAsFixed(0)}$suffix',
              style: const TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w800,
                color: AppTheme.goldLight,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10.5,
              color: Colors.white.withValues(alpha: 0.72),
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _dividerDot() {
    return Container(
      width: 1,
      height: 26,
      margin: const EdgeInsets.symmetric(horizontal: 6),
      color: Colors.white.withValues(alpha: 0.18),
    );
  }

  Widget _heroGoldButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return PulseScale(
      child: AppTheme.goldButton(
        onPressed: onTap,
        label: label,
        icon: Icon(icon, size: 17),
        height: 48,
      ),
    );
  }

  Widget _heroGlassButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: Colors.white.withValues(alpha: 0.65)),
          backgroundColor: Colors.white.withValues(alpha: 0.06),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18),
        ),
        onPressed: onTap,
        icon: Icon(icon, size: 17),
        label: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
    );
  }
  // ── Section header ──
  Widget _sectionHeader({
    required String title,
    required String subtitle,
    required VoidCallback onSeeAll,
  }) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 26, 14, 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: onSeeAll,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Text('Lihat semua'),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward, size: 15),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Truck carousel ──
  Widget _buildTruckCarousel() {
    if (_loading) {
      return SliverToBoxAdapter(
        child: SizedBox(
          height: 320,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerBox(height: 320),
          ),
        ),
      );
    }
    if (_trucks.isEmpty) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(
            child: Text(
              'Belum ada truck',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ),
        ),
      );
    }
    return SliverToBoxAdapter(
      child: Column(
        children: [
          SizedBox(
            height: 330,
            child: PageView.builder(
              controller: _truckCarousel,
              padEnds: false,
              itemCount: _trucks.length,
              onPageChanged: (i) => setState(() => _truckPage = i),
              itemBuilder: (ctx, i) {
                final truck = _trucks[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: TruckCard(
                    imageUrl: truck.primaryImageUrl,
                    brand: truck.brand,
                    model: truck.model,
                    year: truck.year,
                    categoryName: truck.category?.name,
                    price: truck.price,
                    location: truck.location,
                    delayMs: 0,
                    fillImage: true,
                    onTap: () => Navigator.push(
                      ctx,
                      MaterialPageRoute(
                        builder: (_) => TruckDetailScreen(truckId: truck.id),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < _trucks.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _truckPage ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: i == _truckPage ? AppTheme.goldGradient : null,
                    color: i == _truckPage ? null : Colors.black12,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Orange row ──
  Widget _buildOrangeRow() {
    if (_loading) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: ShimmerBox(height: 150),
        ),
      );
    }
    if (_oranges.isEmpty) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(
            child: Text(
              'Belum ada produk jeruk',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ),
        ),
      );
    }
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 250,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          itemCount: _oranges.length,
          itemBuilder: (ctx, i) {
            final product = _oranges[i];
            return SizedBox(
              width: 210,
              child: OrangeProductCard(
                imageUrl: product.primaryImageUrl,
                name: product.name,
                categoryName: product.category?.name,
                grade: product.grade,
                pricePerKg: product.pricePerKg,
                stockKg: product.stockKg,
                delayMs: 50.0 * i,
                fillImage: true,
                onTap: () => Navigator.push(
                  ctx,
                  MaterialPageRoute(
                    builder: (_) => OrangeDetailScreen(productId: product.id),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ── Why section ──
  Widget _buildWhySection() {
    final items = [
      (
        icon: Icons.local_shipping_outlined,
        title: 'Truck Siap Jual & Sewa',
        desc:
            'Pickup, Box, Fuso, Tronton, Dump, hingga Cold Storage — spesifikasi lengkap dan harga transparan.',
      ),
      (
        icon: Icons.eco_outlined,
        title: 'Jeruk dari Kebun',
        desc:
            'Jeruk segar langsung dari kebun ${AppConfig.addressStreet}. Tersedia grade A, B, C dengan harga grosir.',
      ),
      (
        icon: Icons.verified_outlined,
        title: 'Pengiriman Terpercaya',
        desc:
            'Pengiriman dengan armada truck sendiri. Jadwal fleksibel, biaya bisa dikonfirmasi lebih dulu.',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 30, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealFade(
            child: Text(
              'Kenapa ${AppConfig.companyName}?',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
          ),
          const SizedBox(height: 14),
          for (var i = 0; i < items.length; i++)
            RevealFade(
              delayMs: 70.0 * i,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: LuxCard(
                  onTap: () {},
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [AppTheme.primary, AppTheme.goldDeep],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            items[i].icon,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                items[i].title,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                items[i].desc,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppTheme.textSecondary,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── CTA band ──
  Widget _buildCtaBand() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: RevealFade(
        child: AnimatedGradientBackground(
          phases: const [
            [AppTheme.primaryDark, AppTheme.primary],
            [AppTheme.forest, AppTheme.primaryDark],
          ],
          period: const Duration(seconds: 6),
          borderRadius: BorderRadius.all(Radius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Siap menemukan truck atau jeruk segar?',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Jelajahi katalog dan sewa armada hanya dari genggaman Anda.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: AppTheme.goldButton(
                        onPressed: () => setState(() => _currentIndex = 1),
                        label: 'Lihat Truck',
                        height: 44,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: AppTheme.goldButton(
                        onPressed: () => setState(() => _currentIndex = 3),
                        label: 'Beli Jeruk',
                        height: 44,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Counter yang bisa di-dalay via RevealFade induk (tetap count-up halus).
class ReelAnimatedCounter extends StatelessWidget {
  final double value;
  final Widget Function(double v) builder;

  const ReelAnimatedCounter({
    super.key,
    required this.value,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value),
      duration: const Duration(milliseconds: 1700),
      curve: Curves.easeOutQuart,
      builder: (context, v, _) => builder(v),
    );
  }
}
