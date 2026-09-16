import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

class OrderManagement extends StatefulWidget {
  const OrderManagement({super.key});

  @override
  State<OrderManagement> createState() => _OrderManagementState();
}

class _OrderManagementState extends State<OrderManagement> {
  String _filterStatus = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadOrders();
  }

  /// Alur status yang runtut — selaras dengan backend (STATUS_FLOW):
  /// pending -> confirmed -> processing -> shipping -> delivered -> completed.
  static const _nextStatusMap = <String, List<String>>{
    'pending': ['confirmed'],
    'confirmed': ['processing'],
    'processing': ['shipping'],
    'shipping': ['delivered'],
    'delivered': ['completed'],
    'completed': [],
    'cancelled': [],
  };

  static const _statusLabels = <String, String>{
    'pending': 'Menunggu',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Diproses',
    'shipping': 'Dikirim',
    'delivered': 'Diterima',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
  };

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'processing': return Colors.purple;
      case 'shipping': return Colors.cyan;
      case 'delivered': return Colors.teal;
      case 'completed': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) => _statusLabels[status] ?? status;

  String _paymentLabel(String? paymentStatus) {
    switch (paymentStatus) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Menunggu Pembayaran';
      case 'dp_paid': return 'DP Dibayar (50%)';
      case 'failed': return 'Gagal';
      case 'refunded': return 'Dikembalikan';
      default: return 'Belum Bayar';
    }
  }

  Color _paymentColor(String? paymentStatus) {
    switch (paymentStatus) {
      case 'paid': return Colors.green;
      case 'pending':
      case 'dp_paid': return Colors.amber;
      case 'failed': return Colors.red;
      default: return Colors.orange;
    }
  }

  String _paymentMethodLabel(String? method) {
    switch (method) {
      case 'online': return 'Online';
      case 'dp_online': return 'DP 50%';
      case 'cod': return 'COD';
      case 'face_to_face': return 'Face to Face';
      default: return '-';
    }
  }

  Future<void> _advanceStatus(Map<String, dynamic> order, String next) async {
    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final ok = await admin.updateOrderStatus(order['id'] as int, next);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok
            ? 'Status pesanan diubah menjadi ${_statusLabel(next)}.'
            : 'Gagal mengubah status pesanan. Alur harus runtut.'),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  Future<void> _confirmCash(Map<String, dynamic> order, {bool reject = false}) async {
    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final ok = await admin.confirmCashPayment(order['id'] as int, reject: reject);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok
            ? (reject ? 'Pembayaran ditolak.' : 'Pembayaran tunai dikonfirmasi — status pesanan tidak berubah.')
            : 'Gagal memproses konfirmasi pembayaran.'),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filteredOrders = _filterStatus.isEmpty
        ? admin.orders
        : admin.orders.where((o) => o['status'] == _filterStatus).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with filter
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Daftar Pesanan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
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
                    DropdownMenuItem(value: 'processing', child: Text('Diproses')),
                    DropdownMenuItem(value: 'shipping', child: Text('Dikirim')),
                    DropdownMenuItem(value: 'delivered', child: Text('Diterima')),
                    DropdownMenuItem(value: 'completed', child: Text('Selesai')),
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

          // Table
          Expanded(
            child: filteredOrders.isEmpty
                ? const Center(child: Text('Belum ada pesanan'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('No. Pesanan')),
                        DataColumn(label: Text('Pelanggan')),
                        DataColumn(label: Text('Total')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Pembayaran')),
                        DataColumn(label: Text('Tanggal')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filteredOrders.map((order) {
                        final status = order['status'] as String? ?? 'pending';
                        final paymentMethod = order['payment_method'] as String?;
                        final paymentStatus = order['payment_status'] as String?;
                        final nextList = _nextStatusMap[status] ?? const [];
                        final isCash = paymentMethod == 'cod' || paymentMethod == 'face_to_face' || paymentMethod == 'dp_online';

                        return DataRow(cells: [
                          DataCell(Text(
                            order['order_number'] ?? '-',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          )),
                          DataCell(Text(order['customer_name'] ?? '-')),
                          DataCell(Text(
                            NumberFormat.currency(locale: 'id', symbol: 'Rp')
                                .format(order['total'] ?? 0),
                            style: const TextStyle(fontWeight: FontWeight.bold),
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
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _paymentLabel(paymentStatus),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: _paymentColor(paymentStatus),
                                  ),
                                ),
                                Text(
                                  _paymentMethodLabel(paymentMethod),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          DataCell(Text(order['created_at'] ?? '-')),
                          DataCell(
                            Row(
                              children: [
                                // Langkah status berikutnya (runtut, tanpa lompat).
                                for (final next in nextList)
                                  TextButton(
                                    onPressed: _busy ? null : () => _advanceStatus(order, next),
                                    child: Text('→ ${_statusLabel(next)}'),
                                  ),
                                // Konfirmasi tunai untuk F2F/COD/pelunasan DP —
                                // hanya ubah payment_status.
                                if (isCash && paymentStatus != 'paid') ...[
                                  TextButton(
                                    onPressed: _busy ? null : () => _confirmCash(order),
                                    child: Text(
                                      paymentMethod == 'dp_online' ? '✓ Lunasi' : '✓ Bayar',
                                      style: const TextStyle(color: Colors.green),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _busy ? null : () => _confirmCash(order, reject: true),
                                    child: const Text('✗ Tolak', style: TextStyle(color: Colors.red)),
                                  ),
                                ],
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
