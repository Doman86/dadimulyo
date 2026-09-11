import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/admin_provider.dart';
import 'login_screen.dart';
import 'products/truck_management.dart';
import 'products/orange_management.dart';
import 'orders/order_management.dart';
import 'rentals/rental_management.dart';
import 'customers/customer_management.dart';
import 'reviews/review_management.dart';
import 'reports/sales_report.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  final _pageController = PageController();

  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadDashboard();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onMenuTap(int index) {
    setState(() => _selectedIndex = index);
    _pageController.jumpToPage(index);
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          _buildSidebar(admin),
          
          // Main content
          Expanded(
            child: Column(
              children: [
                // Top bar
                _buildTopBar(admin),
                
                // Content
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _DashboardHome(admin: admin),
                      const TruckManagement(),
                      const OrangeManagement(),
                      const OrderManagement(),
                      const RentalManagement(),
                      const CustomerManagement(),
                      const ReviewManagement(),
                      const SalesReport(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar(AdminProvider admin) {
    return Container(
      width: 260,
      color: const Color(0xFF1B2A1B),
      child: Column(
        children: [
          // Logo
          Container(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(child: Text('🚛', style: TextStyle(fontSize: 20))),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Dadi Mulyo',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Admin Panel',
                      style: TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white24, height: 1),
          
          // Menu items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _menuItem(0, Icons.dashboard_outlined, 'Dashboard'),
                _menuItem(1, Icons.local_shipping_outlined, 'Truck'),
                _menuItem(2, Icons.eco_outlined, 'Jeruk'),
                _menuItem(3, Icons.shopping_cart_outlined, 'Pesanan'),
                _menuItem(4, Icons.calendar_today_outlined, 'Sewa'),
                _menuItem(5, Icons.people_outlined, 'Pelanggan'),
                _menuItem(6, Icons.star_outlined, 'Ulasan'),
                _menuItem(7, Icons.assessment_outlined, 'Laporan'),
              ],
            ),
          ),
          
          // Logout
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white54,
                  side: const BorderSide(color: Colors.white24),
                ),
                onPressed: () async {
                  await admin.logout();
                  if (context.mounted) {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  }
                },
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Keluar'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? Colors.white : Colors.white54,
        size: 20,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.white54,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: Colors.white.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      onTap: () => _onMenuTap(index),
    );
  }

  Widget _buildTopBar(AdminProvider admin) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          Text(
            ['Dashboard', 'Truck', 'Jeruk', 'Pesanan', 'Sewa', 'Pelanggan', 'Ulasan', 'Laporan'][_selectedIndex],
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          // User avatar
          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.green[700],
            child: const Text('A', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD HOME
// ════════════════════════════════════════════════════════════════

class _DashboardHome extends StatelessWidget {
  final AdminProvider admin;
  
  const _DashboardHome({required this.admin});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats cards
          Row(
            children: [
              _statCard(
                'Pesanan Hari Ini',
                '${admin.todaySales.toInt()}',
                Icons.shopping_cart,
                Colors.blue,
              ),
              const SizedBox(width: 16),
              _statCard(
                'Menunggu Konfirmasi',
                '${admin.pendingOrders}',
                Icons.pending_actions,
                Colors.orange,
              ),
              const SizedBox(width: 16),
              _statCard(
                'Sewa Aktif',
                '${admin.pendingRentals}',
                Icons.calendar_today,
                Colors.green,
              ),
              const SizedBox(width: 16),
              _statCard(
                'Penjualan Bulan Ini',
                NumberFormat.currency(locale: 'id', symbol: 'Rp').format(admin.monthSales),
                Icons.monetization_on,
                Colors.purple,
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // Quick actions
          const Text(
            'Aksi Cepat',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _quickAction(
                context,
                'Kelola Truck',
                Icons.local_shipping,
                Colors.green,
                () {},
              ),
              const SizedBox(width: 12),
              _quickAction(
                context,
                'Kelola Jeruk',
                Icons.eco,
                Colors.orange,
                () {},
              ),
              const SizedBox(width: 12),
              _quickAction(
                context,
                'Pesanan Baru',
                Icons.shopping_cart,
                Colors.blue,
                () {},
              ),
              const SizedBox(width: 12),
              _quickAction(
                context,
                'Lihat Laporan',
                Icons.assessment,
                Colors.purple,
                () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickAction(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 32),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
