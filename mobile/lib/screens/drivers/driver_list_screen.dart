import 'package:flutter/material.dart';
import '../../models/driver.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'driver_detail_screen.dart';
import 'driver_form_screen.dart';

class DriverListScreen extends StatefulWidget {
  const DriverListScreen({super.key});

  @override
  State<DriverListScreen> createState() => _DriverListScreenState();
}

class _DriverListScreenState extends State<DriverListScreen> {
  final _api = ApiClient();
  List<Driver> _drivers = [];
  bool _loading = true;
  String _search = '';
  String _statusFilter = '';
  String _typeFilter = '';

  @override
  void initState() {
    super.initState();
    _loadDrivers();
  }

  Future<void> _loadDrivers() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_search.isNotEmpty) params['search'] = _search;
      if (_statusFilter.isNotEmpty) params['status'] = _statusFilter;
      if (_typeFilter.isNotEmpty) params['driver_type'] = _typeFilter;
      params['per_page'] = 50;

      final result = await _api.getDrivers(params);
      setState(() {
        _drivers =
            (result['data']?['data'] as List?)
                ?.map((e) => Driver.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteDriver(Driver driver) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Driver?'),
        content: Text('Hapus ${driver.name} dari daftar driver?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        await _api.deleteDriver(driver.id);
        _loadDrivers();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Driver berhasil dihapus.')),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gagal menghapus driver.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manajemen Driver'),
        actions: [
          IconButton(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DriverFormScreen()),
              );
              if (result == true) _loadDrivers();
            },
            icon: const Icon(Icons.person_add_outlined),
            tooltip: 'Tambah Driver',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Cari nama driver...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (v) {
                    _search = v;
                    _loadDrivers();
                  },
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _statusFilter.isEmpty ? null : _statusFilter,
                        hint: const Text(
                          'Status',
                          style: TextStyle(fontSize: 13),
                        ),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: '', child: Text('Semua')),
                          DropdownMenuItem(value: 'active', child: Text('Aktif')),
                          DropdownMenuItem(value: 'inactive', child: Text('Non-aktif')),
                          DropdownMenuItem(value: 'suspended', child: Text('Ditangguhkan')),
                        ],
                        onChanged: (v) {
                          _statusFilter = v ?? '';
                          _loadDrivers();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _typeFilter.isEmpty ? null : _typeFilter,
                        hint: const Text(
                          'Tipe',
                          style: TextStyle(fontSize: 13),
                        ),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: '', child: Text('Semua')),
                          DropdownMenuItem(value: 'tetap', child: Text('Tetap')),
                          DropdownMenuItem(value: 'lepas', child: Text('Lepas')),
                        ],
                        onChanged: (v) {
                          _typeFilter = v ?? '';
                          _loadDrivers();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Driver list
          Expanded(
            child: _loading
                ? const LoadingWidget(message: 'Memuat data driver...')
                : _drivers.isEmpty
                ? const EmptyState(
                    emoji: '🚛',
                    title: 'Belum Ada Driver',
                    subtitle: 'Tambahkan driver baru untuk mulai mengelola armada.',
                  )
                : RefreshIndicator(
                    onRefresh: _loadDrivers,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _drivers.length,
                      itemBuilder: (ctx, i) => _driverCard(_drivers[i]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _driverCard(Driver driver) {
    final isActive = driver.isActive;
    final statusColor = isActive
        ? Colors.green
        : driver.status == 'suspended'
            ? Colors.orange
            : Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DriverDetailScreen(driverId: driver.id),
            ),
          );
          if (result == true) _loadDrivers();
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                child: Text(
                  driver.name.isNotEmpty ? driver.name[0].toUpperCase() : '?',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            driver.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            driver.statusLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        // Type badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: driver.isTetap
                                ? Colors.blue[50]!
                                : Colors.purple[50]!,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            driver.driverTypeLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: driver.isTetap ? Colors.blue : Colors.purple,
                            ),
                          ),
                        ),
                        if (driver.licenseClass != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            'SIM ${driver.licenseClass}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (driver.phone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        driver.phone!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                    // Stats
                    if (driver.totalRentalsHandled != null ||
                        driver.averageRating != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (driver.totalRentalsHandled != null) ...[
                            Icon(
                              Icons.local_shipping_outlined,
                              size: 12,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              '${driver.totalRentalsHandled} rental',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                          if (driver.averageRating != null) ...[
                            const SizedBox(width: 12),
                            Icon(Icons.star, size: 12, color: Colors.amber[600]),
                            const SizedBox(width: 3),
                            Text(
                              driver.averageRating!.toStringAsFixed(1),
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                          if (driver.totalEarningsThisMonth != null) ...[
                            const SizedBox(width: 12),
                            Icon(
                              Icons.monetization_on_outlined,
                              size: 12,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              AppTheme.formatRupiah(driver.totalEarningsThisMonth!),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // Actions
              PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'edit') {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DriverFormScreen(driver: driver),
                      ),
                    );
                    if (result == true) _loadDrivers();
                  } else if (value == 'delete') {
                    _deleteDriver(driver);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit_outlined, size: 18),
                        SizedBox(width: 8),
                        Text('Edit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, size: 18, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Hapus', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
