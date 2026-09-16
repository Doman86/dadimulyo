import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

class RentalManagement extends StatefulWidget {
  const RentalManagement({super.key});

  @override
  State<RentalManagement> createState() => _RentalManagementState();
}

class _RentalManagementState extends State<RentalManagement> {
  String _filterStatus = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadRentals();
    });
  }

  // Alur status rental sesuai backend:
  // pending -> confirmed -> active -> completed (cancelled kapan saja oleh admin).
  static const _nextStatusMap = <String, List<String>>{
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['active', 'cancelled'],
    'active': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
  };

  static const _statusLabels = <String, String>{
    'pending': 'Menunggu',
    'confirmed': 'Dikonfirmasi',
    'active': 'Aktif',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
  };

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'active': return Colors.green;
      case 'completed': return Colors.green[700]!;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) => _statusLabels[status] ?? status;

  String _truckName(Map<String, dynamic> rental) {
    final truck = rental['truck'];
    if (truck is Map) return '${truck['brand'] ?? ''} ${truck['model'] ?? ''}'.trim();
    return rental['truck_name']?.toString() ?? '-';
  }

  String _customerName(Map<String, dynamic> rental) {
    final customer = rental['customer'];
    if (customer is Map) return customer['name']?.toString() ?? '-';
    return rental['customer_name']?.toString() ?? '-';
  }

  String _customerPhone(Map<String, dynamic> rental) {
    final customer = rental['customer'];
    if (customer is Map) return customer['phone']?.toString() ?? '';
    return '';
  }

  String _paymentInfo(Map<String, dynamic> rental) {
    final paymentStatus = rental['payment_status']?.toString();
    switch (paymentStatus) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Menunggu Verifikasi';
      case 'failed': return 'Gagal';
      default: return 'Belum Bayar';
    }
  }

  Future<void> _changeStatus(Map<String, dynamic> rental, String next) async {
    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final ok = await admin.updateRental(rental['id'] as int, {'status': next});
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok
            ? 'Booking diubah menjadi ${_statusLabel(next)}.'
            : (admin.error ?? 'Gagal mengubah status booking.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  Future<void> _deleteRental(Map<String, dynamic> rental) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Booking?'),
        content: Text('Booking #${rental['id']} (${_truckName(rental)}) akan dihapus permanen.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final ok = await admin.deleteRental(rental['id'] as int);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Booking dihapus.' : (admin.error ?? 'Gagal menghapus booking.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filteredRentals = _filterStatus.isEmpty
        ? admin.rentals
        : admin.rentals.where((r) => r['status'] == _filterStatus).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Daftar Sewa Truck',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadRentals(),
                icon: const Icon(Icons.refresh),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _filterStatus.isEmpty ? null : _filterStatus,
                  hint: const Text('Semua Status'),
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: '', child: Text('Semua')),
                    DropdownMenuItem(value: 'pending', child: Text('Menunggu')),
                    DropdownMenuItem(value: 'confirmed', child: Text('Dikonfirmasi')),
                    DropdownMenuItem(value: 'active', child: Text('Aktif')),
                    DropdownMenuItem(value: 'completed', child: Text('Selesai')),
                    DropdownMenuItem(value: 'cancelled', child: Text('Dibatalkan')),
                  ],
                  onChanged: (v) => setState(() => _filterStatus = v ?? ''),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (admin.error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(admin.error!,
                  style: const TextStyle(color: Colors.red, fontSize: 12)),
            ),

          Expanded(
            child: filteredRentals.isEmpty
                ? const Center(child: Text('Belum ada booking sewa'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('ID')),
                        DataColumn(label: Text('Truck')),
                        DataColumn(label: Text('Pelanggan')),
                        DataColumn(label: Text('Tanggal')),
                        DataColumn(label: Text('Durasi')),
                        DataColumn(label: Text('Total')),
                        DataColumn(label: Text('Pembayaran')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filteredRentals.map((rental) {
                        final status = rental['status']?.toString() ?? 'pending';
                        final nextList = _nextStatusMap[status] ?? const <String>[];

                        return DataRow(cells: [
                          DataCell(Text('#${rental['id']}')),
                          DataCell(Text(_truckName(rental))),
                          DataCell(Text(
                            '${_customerName(rental)}\n${_customerPhone(rental)}',
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(Text(
                            '${rental['start_date'] ?? '-'} s/d ${rental['end_date'] ?? '-'}',
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(Text('${rental['days'] ?? 0} hari')),
                          DataCell(Text(
                            NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0)
                                .format(rental['total_price'] ?? 0),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )),
                          DataCell(Text(
                            _paymentInfo(rental),
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _statusLabel(status),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _statusColor(status),
                                ),
                              ),
                            ),
                          ),
                          DataCell(
                            Row(
                              children: [
                                for (final next in nextList)
                                  if (next == 'cancelled')
                                    TextButton(
                                      onPressed: _busy ? null : () => _changeStatus(rental, next),
                                      child: const Text('Batalkan', style: TextStyle(color: Colors.red)),
                                    )
                                  else
                                    TextButton(
                                      onPressed: _busy ? null : () => _changeStatus(rental, next),
                                      child: Text('→ ${_statusLabel(next)}'),
                                    ),
                                IconButton(
                                  tooltip: 'Hapus',
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                  onPressed: _busy ? null : () => _deleteRental(rental),
                                ),
                              ],
                            ),
                          ),
                        ]);
                      }).toList(),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
