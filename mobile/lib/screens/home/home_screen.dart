import 'package:flutter/material.dart';
import '../../models/truck.dart';
import '../../models/orange_product.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/shared_widgets.dart';
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

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final truckResult = await _api.getTrucks({'per_page': 6});
      final orangeResult = await _api.getOranges({'per_page': 6, 'in_stock': 1});
      setState(() {
        _trucks = (truckResult['data']?['data'] as List?)
                ?.map((e) => Truck.fromJson(e))
                .toList() ??
            [];
        _oranges = (orangeResult['data']?['data'] as List?)
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
    final pages = [
      _buildHomePage(),
      const TruckListScreen(),
      const RentalScreen(),
      const OrangeListScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Beranda'),
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping_outlined), activeIcon: Icon(Icons.local_shipping), label: 'Truck'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), activeIcon: Icon(Icons.calendar_today), label: 'Sewa'),
          BottomNavigationBarItem(icon: Icon(Icons.local_grocery_store_outlined), activeIcon: Icon(Icons.local_grocery_store), label: 'Jeruk'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outlined), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }

  Widget _buildHomePage() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            title: RichText(
              text: const TextSpan(children: [
                TextSpan(text: 'Dadi ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                TextSpan(text: 'Mulyo', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.secondary)),
              ]),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () => Navigator.push(
                    context, MaterialPageRoute(builder: (_) => const CartScreen())),
              ),
            ],
          ),

          // Hero
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppTheme.primaryDark, AppTheme.primary],
                ),
              ),
              child: Column(
                children: [
                  const Text('Showroom Truck & Jeruk Segar dari Malang',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),
                  const Text(
                      'Dadi Mulyo melayani penjualan dan penyewaan truck serta marketplace jeruk berkualitas dari Wagir, Kabupaten Malang.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
                        onPressed: () => setState(() => _currentIndex = 1),
                        child: const Text('Lihat Truck'),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white, side: const BorderSide(color: Colors.white)),
                        onPressed: () => setState(() => _currentIndex = 3),
                        child: const Text('Beli Jeruk'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Featured Trucks
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Truck Terbaru',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  TextButton(
                    onPressed: () => setState(() => _currentIndex = 1),
                    child: const Text('Lihat semua →'),
                  ),
                ],
              ),
            ),
          ),

          if (_loading)
            const SliverToBoxAdapter(child: Padding(
                padding: EdgeInsets.all(32), child: LoadingWidget()))
          else if (_trucks.isEmpty)
            const SliverToBoxAdapter(
                child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: Text('Belum ada truck', style: TextStyle(color: AppTheme.textSecondary)))))
          else
            SliverToBoxAdapter(
              child: SizedBox(
                height: 260,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _trucks.length,
                  itemBuilder: (ctx, i) {
                    final truck = _trucks[i];
                    return SizedBox(
                      width: 260,
                      child: TruckCard(
                        imageUrl: truck.primaryImageUrl,
                        brand: truck.brand,
                        model: truck.model,
                        year: truck.year,
                        categoryName: truck.category?.name,
                        price: truck.price,
                        location: truck.location,
                        onTap: () => Navigator.push(ctx,
                            MaterialPageRoute(builder: (_) => TruckDetailScreen(truckId: truck.id))),
                      ),
                    );
                  },
                ),
              ),
            ),

          // Orange Products
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Jeruk Pilihan',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  TextButton(
                    onPressed: () => setState(() => _currentIndex = 3),
                    child: const Text('Lihat semua →'),
                  ),
                ],
              ),
            ),
          ),

          if (_oranges.isEmpty && !_loading)
            const SliverToBoxAdapter(
                child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: Text('Belum ada produk jeruk', style: TextStyle(color: AppTheme.textSecondary)))))
          else
            SliverToBoxAdapter(
              child: SizedBox(
                height: 240,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _oranges.length,
                  itemBuilder: (ctx, i) {
                    final product = _oranges[i];
                    return SizedBox(
                      width: 220,
                      child: OrangeProductCard(
                        imageUrl: product.primaryImageUrl,
                        name: product.name,
                        categoryName: product.category?.name,
                        grade: product.grade,
                        pricePerKg: product.pricePerKg,
                        stockKg: product.stockKg,
                        onTap: () => Navigator.push(ctx,
                            MaterialPageRoute(builder: (_) => OrangeDetailScreen(productId: product.id))),
                      ),
                    );
                  },
                ),
              ),
            ),

          // Why Dadi Mulyo
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  const Text('Kenapa Dadi Mulyo?',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 16),
                  _whyCard('🚛', 'Truck Siap Jual & Sewa', 'Pilihan truck lengkap dengan spesifikasi detail dan harga transparan.'),
                  const SizedBox(height: 12),
                  _whyCard('🍊', 'Jeruk dari Kebun', 'Jeruk segar langsung dari kebun Wagir, Malang. Harga grosir tersedia.'),
                  const SizedBox(height: 12),
                  _whyCard('🚚', 'Pengiriman Terpercaya', 'Pengiriman dengan truck sendiri untuk pesanan jeruk Anda.'),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _whyCard(String emoji, String title, String desc) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 36)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
