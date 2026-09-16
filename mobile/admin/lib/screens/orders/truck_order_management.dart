import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

/// Kelola pesanan truck (pembelian truck) — paritas dengan AdminTruckOrders web.
class TruckOrderManagement extends StatefulWidget {
  const TruckOrderManagement({super.key});

  @override
  State<TruckOrderManagement> createState() => _TruckOrderManagementState();
}

class _TruckOrderManagementState extends State<TruckOrderManagement> {
  String _filterStatus = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadTruckOrders();
    });
  }

  static const _statusLabels = <String, String>{
    'pending': 'Menunggu',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Diproses',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
  };

  static const _paymentLabels = <String, String>{
    'unpaid': 'Belum Bayar',
    'pending': 'Menunggu Verifikasi',
    'paid': 'Lunas',
    'failed': 'Gagal',
    'refunded': 'Dikembalikan',
  };

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'processing': return Colors.purple;
      case 'completed': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  Color _paymentColor(String status) {
    switch (status) {
      case 'paid': return Colors.green;
      case 'pending': return Colors.amber;
      case 'failed': return Colors.red;
      case 'refunded': return Colors.purple;
      default: return Colors.grey;
    }
  }

  String _truckName(Map<String, dynamic> order) {
    final truck = order['truck'];
    if (truck is Map) return '${truck['brand'] ?? ''} ${truck['model'] ?? ''}'.trim();
    return '-';
  }

  String _customerName(Map<String, dynamic> order) {
    final customer = order['customer'];
    if (customer is Map) return customer['name']?.toString() ?? '-';
    return '-';
  }

  String _customerPhone(Map<String, dynamic> order) {
    final phone = order['phone'];
    if (phone != null && phone.toString().isNotEmpty) return phone.toString();
    final customer = order['customer'];
    if (customer is Map) return customer['phone']?.toString() ?? '';
    return '';
  }

  /// Jumlah bukti transfer manual yang menunggu verifikasi.
  int _pendingPayments(Map<String, dynamic> order) {
    final payments = order['payments'];
    if (payments is! List) return 0;
    return payments.where((p) => p is Map && p['status'] == 'pending').length;
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('d MMM yyyy, HH:mm', 'id').format(parsed);
  }

  Future<void> _save(Map<String, dynamic> order, String status, String paymentStatus) async {
    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final data = <String, dynamic>{
      if (status != order['status']) 'status': status,
      if (paymentStatus != order['payment_status']) 'payment_status': paymentStatus,
    };
    final ok = data.isEmpty ? true : await admin.updateTruckOrderStatus(order['id'] as int, data);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Pesanan truck diperbarui.' : (admin.error ?? 'Gagal memperbarui pesanan truck.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  void _showEditDialog(Map<String, dynamic> order) {
    String status = order['status']?.toString() ?? 'pending';
    String paymentStatus = order['payment_status']?.toString() ?? 'unpaid';

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('Kelola ${order['order_number'] ?? 'Pesanan'}'),
          content: SizedBox(
            width: 360,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: status,
                  decoration: const InputDecoration(labelText: 'Status Pesanan'),
                  items: _statusLabels.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => status = v ?? status),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: paymentStatus,
                  decoration: const InputDecoration(labelText: 'Pembayaran'),
                  items: _paymentLabels.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => paymentStatus = v ?? paymentStatus),
                ),
                const SizedBox(height: 8),
                Text(
                  'Set pembayaran jadi "Lunas" untuk memverifikasi bukti transfer.',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                _save(order, status, paymentStatus);
              },
              child: const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filtered = _filterStatus.isEmpty
        ? admin.truckOrders
        : admin.truckOrders.where((o) => o['status'] == _filterStatus).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Pesanan Truck',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadTruckOrders(),
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
                  items: _statusLabels.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
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
            child: filtered.isEmpty
                ? const Center(child: Text('Belum ada pesanan truck'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('No. Pesanan')),
                        DataColumn(label: Text('Truck')),
                        DataColumn(label: Text('Pembeli')),
                        DataColumn(label: Text('Total')),
                        DataColumn(label: Text('Pembayaran')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Tanggal')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filtered.map((order) {
                        final status = order['status']?.toString() ?? 'pending';
                        final paymentStatus = order['payment_status']?.toString() ?? 'unpaid';
                        final pendingCount = _pendingPayments(order);

                        return DataRow(cells: [
                          DataCell(Text(
                            order['order_number'] ?? '-',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          )),
                          DataCell(Text(_truckName(order))),
                          DataCell(Text(
                            '${_customerName(order)}\n${_customerPhone(order)}',
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(Text(
                            NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0)
                                .format(order['amount'] ?? 0),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )),
                          DataCell(Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _paymentLabels[paymentStatus] ?? paymentStatus,
                                style: TextStyle(fontSize: 12, color: _paymentColor(paymentStatus)),
                              ),
                              if (pendingCount > 0)
                                Text(
                                  '⏳ $pendingCount bukti transfer',
                                  style: const TextStyle(fontSize: 10, color: Colors.orange),
                                ),
                            ],
                          )),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _statusLabels[status] ?? status,
                                style: TextStyle(fontSize: 12, color: _statusColor(status)),
                              ),
                            ),
                          ),
                          DataCell(Text(_formatDate(order['created_at']), style: const TextStyle(fontSize: 12))),
                          DataCell(
                            ElevatedButton(
                              onPressed: _busy ? null : () => _showEditDialog(order),
                              child: const Text('Kelola'),
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
