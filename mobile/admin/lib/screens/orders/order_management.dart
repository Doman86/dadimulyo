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

  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadOrders();
  }

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

  String _statusLabel(String status) {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'processing': return 'Diproses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
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
                    DropdownMenuItem(value: 'completed', child: Text('Selesai')),
                  ],
                  onChanged: (v) => setState(() => _filterStatus = v ?? ''),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

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
                                color: _statusColor(order['status'] ?? '').withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _statusLabel(order['status'] ?? ''),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _statusColor(order['status'] ?? ''),
                                ),
                              ),
                            ),
                          ),
                          DataCell(Text(
                            order['payment_status'] == 'paid' ? 'Lunas' : 'Belum Bayar',
                            style: TextStyle(
                              color: order['payment_status'] == 'paid'
                                  ? Colors.green
                                  : Colors.orange,
                            ),
                          )),
                          DataCell(Text(order['created_at'] ?? '-')),
                          DataCell(
                            Row(
                              children: [
                                if (order['status'] == 'pending')
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateOrderStatus(order['id'], 'confirmed');
                                    },
                                    child: const Text('Konfirmasi'),
                                  ),
                                if (order['status'] == 'confirmed')
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateOrderStatus(order['id'], 'processing');
                                    },
                                    child: const Text('Proses'),
                                  ),
                                if (order['status'] == 'processing')
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateOrderStatus(order['id'], 'completed');
                                    },
                                    child: const Text('Selesai'),
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
