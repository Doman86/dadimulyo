import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/admin_provider.dart';
import 'login_screen.dart';
import 'products/truck_management.dart';
import 'products/orange_management.dart';
import 'orders/order_management.dart';
import 'orders/truck_order_management.dart';
import 'orders/delivery_management.dart';
import 'rentals/rental_management.dart';
import 'customers/lead_management.dart';
import 'customers/user_management.dart';
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
    // Muat data dashboard & kategori saat panel dibuka.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final admin = context.read<AdminProvider>();
      admin.loadDashboard();
      admin.loadCategories();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onMenuTap(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final menu = _menuForRole(admin.roleName);

    // Jaga index tetap valid untuk role ini.
    final index = _selectedIndex.clamp(0, menu.length - 1);

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          _buildSidebar(admin, menu),

          // Main content
          Expanded(
            child: Column(
              children: [
                // Top bar
                _buildTopBar(admin, menu),

                // Content — IndexedStack menjaga state tiap tab.
                Expanded(
                  child: IndexedStack(
                    index: index,
                    children: [
                      for (final item in menu) item.page,
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

  List<_MenuItem> _menuForRole(String? role) {
    final isAdmin = role == 'admin';
    final canTrucks = isAdmin || role == 'truck_seller';
    final canOranges = isAdmin || role == 'orange_seller';
    final canLeads = isAdmin || role == 'sales';

    return [
      _MenuItem(0, Icons.dashboard_outlined, 'Dashboard', _DashboardHome()),
      if (canTrucks)
        _MenuItem(1, Icons.local_shipping_outlined, 'Truck', const TruckManagement()),
      if (isAdmin)
        _MenuItem(2, Icons.calendar_today_outlined, 'Sewa', const RentalManagement()),
      if (isAdmin)
        _MenuItem(3, Icons.shopping_cart_outlined, 'Pesanan', const OrderManagement()),
      if (isAdmin)
        _MenuItem(4, Icons.local_shipping, 'Pesanan Truck', const TruckOrderManagement()),
      if (isAdmin)
        _MenuItem(5, Icons.inventory_2_outlined, 'Pengiriman', const DeliveryManagement()),
      if (canOranges)
        _MenuItem(6, Icons.eco_outlined, 'Jeruk', const OrangeManagement()),
      if (canLeads)
        _MenuItem(7, Icons.support_agent_outlined, 'Leads', const LeadManagement()),
      if (isAdmin)
        _MenuItem(8, Icons.people_outlined, 'Pengguna', const UserManagement()),
      if (isAdmin)
        _MenuItem(9, Icons.star_outlined, 'Ulasan', const ReviewManagement()),
      if (isAdmin)
        _MenuItem(10, Icons.assessment_outlined, 'Laporan', const SalesReport()),
    ];
  }

  Widget _buildSidebar(AdminProvider admin, List<_MenuItem> menu) {
    final roleLabels = {
      'admin': 'Administrator',
      'sales': 'Sales',
      'truck_seller': 'Truck Seller',
      'orange_seller': 'Orange Seller',
    };
    final selectedIndex = _selectedIndex.clamp(0, menu.length - 1);

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
                for (final item in menu) _menuItem(item, item.index == selectedIndex),
              ],
            ),
          ),

          // User info + logout
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.green[700],
                      child: Text(
                        (admin.user?['name'] ?? 'A')[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            admin.user?['name'] ?? 'Admin',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            roleLabels[admin.roleName] ?? (admin.roleName ?? '-'),
                            style: const TextStyle(color: Colors.white54, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white54,
                      side: const BorderSide(color: Colors.white24),
                    ),
                    onPressed: () async {
                      await admin.logout();
                      if (mounted) {
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
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuItem(_MenuItem item, bool isSelected) {
    return ListTile(
      leading: Icon(
        item.icon,
        color: isSelected ? Colors.white : Colors.white54,
        size: 20,
      ),
      title: Text(
        item.label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.white54,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: Colors.white.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      onTap: () => _onMenuTap(item.index),
    );
  }

  Widget _buildTopBar(AdminProvider admin, List<_MenuItem> menu) {
    final selectedIndex = _selectedIndex.clamp(0, menu.length - 1);

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
            menu[selectedIndex].label,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          // Refresh
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => admin.loadDashboard(),
            icon: const Icon(Icons.refresh),
          ),
          // User avatar
          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.green[700],
            child: Text(
              (admin.user?['name'] ?? 'A')[0].toUpperCase(),
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final int index;
  final IconData icon;
  final String label;
  final Widget page;

  const _MenuItem(this.index, this.icon, this.label, this.page);
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD HOME
// ════════════════════════════════════════════════════════════════

class _DashboardHome extends StatelessWidget {
  final currency = NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0);

  _DashboardHome();

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final s = admin.summary;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats cards — selaras dengan dashboard web (summary).
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _statCard('Total Truck', '${s['trucks_total'] ?? 0}', Icons.local_shipping, Colors.green),
              _statCard('Pesanan', '${s['orders_total'] ?? 0}', Icons.shopping_cart, Colors.blue),
              _statCard('Pesanan Pending', '${s['orders_pending'] ?? 0}', Icons.pending_actions, Colors.orange),
              _statCard('Rental', '${s['rentals_total'] ?? 0}', Icons.calendar_today, Colors.purple),
              _statCard('Leads', '${s['leads_total'] ?? 0}', Icons.support_agent, Colors.teal),
              _statCard('Pengguna', '${s['users_total'] ?? 0}', Icons.people, Colors.indigo),
              _statCard('Produk Jeruk', '${s['oranges_total'] ?? 0}', Icons.eco, Colors.orange),
              _statCard(
                'Pendapatan',
                currency.format((s['revenue'] ?? 0).toDouble()),
                Icons.monetization_on,
                Colors.green,
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
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _quickAction(context, 'Kelola Truck', Icons.local_shipping, Colors.green),
              _quickAction(context, 'Kelola Jeruk', Icons.eco, Colors.orange),
              _quickAction(context, 'Kelola Pengiriman', Icons.inventory_2, Colors.blue),
              _quickAction(context, 'Lihat Laporan', Icons.assessment, Colors.purple),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: 220,
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
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
    );
  }

  Widget _quickAction(BuildContext context, String label, IconData icon, Color color) {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 160,
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
    );
  }
}
