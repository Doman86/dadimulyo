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

  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadRentals();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'approved': return Colors.blue;
      case 'active': return Colors.green;
      case 'completed': return Colors.green[700]!;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'active': return 'Aktif';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
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
                    DropdownMenuItem(value: 'approved', child: Text('Disetujui')),
                    DropdownMenuItem(value: 'active', child: Text('Aktif')),
                    DropdownMenuItem(value: 'completed', child: Text('Selesai')),
                  ],
                  onChanged: (v) => setState(() => _filterStatus = v ?? ''),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
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
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filteredRentals.map((rental) {
                        return DataRow(cells: [
                          DataCell(Text('#${rental['id']}')),
                          DataCell(Text(rental['truck_name'] ?? '-')),
                          DataCell(Text(rental['customer_name'] ?? '-')),
                          DataCell(Text(
                            '${rental['start_date'] ?? '-'} s/d ${rental['end_date'] ?? '-'}',
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(Text('${rental['days'] ?? 0} hari')),
                          DataCell(Text(
                            NumberFormat.currency(locale: 'id', symbol: 'Rp')
                                .format(rental['total_price'] ?? 0),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(rental['status'] ?? '').withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _statusLabel(rental['status'] ?? ''),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _statusColor(rental['status'] ?? ''),
                                ),
                              ),
                            ),
                          ),
                          DataCell(
                            Row(
                              children: [
                                if (rental['status'] == 'pending') ...[
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateRentalStatus(rental['id'], 'approved');
                                    },
                                    child: const Text('Setuju'),
                                  ),
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateRentalStatus(rental['id'], 'cancelled');
                                    },
                                    child: const Text('Tolak', style: TextStyle(color: Colors.red)),
                                  ),
                                ],
                                if (rental['status'] == 'approved')
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateRentalStatus(rental['id'], 'active');
                                    },
                                    child: const Text('Aktifkan'),
                                  ),
                                if (rental['status'] == 'active')
                                  TextButton(
                                    onPressed: () async {
                                      await admin.updateRentalStatus(rental['id'], 'completed');
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
