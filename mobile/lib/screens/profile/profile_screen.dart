import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_theme.dart';
import '../auth/login_screen.dart';
import '../orders/order_list_screen.dart';
import '../rental/rental_screen.dart';
import '../rental/rental_history_screen.dart';
import '../wishlist/wishlist_screen.dart';
import '../drivers/driver_list_screen.dart';
import 'edit_profile_screen.dart';
import 'address_screen.dart';
import '../notifications/notification_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (ctx, auth, _) {
        if (auth.user == null) {
          return _loggedOutView(context);
        }
        return _loggedInView(context, auth);
      },
    );
  }

  Widget _loggedOutView(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.person_outline,
              size: 64,
              color: AppTheme.textSecondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'Silakan login untuk melihat profil',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              ),
              child: const Text('Masuk'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _loggedInView(BuildContext context, AuthProvider auth) {
    final user = auth.user!;
    final roleName = user.role?.name ?? 'customer';
    final displayName = roleName == 'admin'
        ? 'Admin'
        : roleName
              .replaceAll('_', ' ')
              .split(' ')
              .map((w) => w.isNotEmpty
                  ? w[0].toUpperCase() + w.substring(1)
                  : w)
              .join(' ');

    return Scaffold(
      appBar: AppBar(title: const Text('Profil Saya')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar & name
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppTheme.primary,
                    child: Text(
                      user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user.name,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    displayName,
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Info cards
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                children: [
                  _infoRow(Icons.email_outlined, 'Email', user.email),
                  if (user.phone != null)
                    _infoRow(Icons.phone_outlined, 'Telepon', user.phone!),
                  _infoRow(
                    Icons.calendar_today_outlined,
                    'Status',
                    user.status,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Action buttons
            _actionTile(
              context,
              Icons.notifications_outlined,
              'Notifikasi',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.location_on_outlined,
              'Alamat Saya',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddressScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.edit_outlined,
              'Edit Profil',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const EditProfileScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.favorite_outline,
              'Truck Tersimpan',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WishlistScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.receipt_long_outlined,
              'Riwayat Pesanan',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const OrderListScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.local_shipping_outlined,
              'Sewa Truck',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RentalScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.history,
              'Riwayat Sewa',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RentalHistoryScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _actionTile(
              context,
              Icons.people_outlined,
              'Manajemen Driver',
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DriverListScreen()),
              ),
            ),

            const SizedBox(height: 24),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Keluar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.textSecondary),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _actionTile(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primary),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
            const Spacer(),
            const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}
