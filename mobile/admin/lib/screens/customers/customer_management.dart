import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

/// Daftar pelanggan — kini memakai endpoint /users (role=customer).
/// Endpoint /customers tidak ada di backend (dulu selalu 404).
class CustomerManagement extends StatefulWidget {
  const CustomerManagement({super.key});

  @override
  State<CustomerManagement> createState() => _CustomerManagementState();
}

class _CustomerManagementState extends State<CustomerManagement> {
  final bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadCustomers();
    });
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('d MMM yyyy', 'id').format(parsed);
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final customers = admin.users;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Daftar Pelanggan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadCustomers(),
                icon: const Icon(Icons.refresh),
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
            child: customers.isEmpty
                ? const Center(child: Text('Belum ada pelanggan'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('ID')),
                        DataColumn(label: Text('Nama')),
                        DataColumn(label: Text('Email')),
                        DataColumn(label: Text('Telepon')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Bergabung')),
                      ],
                      rows: customers.map((customer) {
                        final status = customer['status']?.toString() ?? 'active';
                        return DataRow(cells: [
                          DataCell(Text('${customer['id']}')),
                          DataCell(Text(customer['name']?.toString() ?? '-')),
                          DataCell(Text(customer['email']?.toString() ?? '-')),
                          DataCell(Text(customer['phone']?.toString() ?? '-')),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: (status == 'active' ? Colors.green : Colors.red).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: status == 'active' ? Colors.green[700] : Colors.red[700],
                                ),
                              ),
                            ),
                          ),
                          DataCell(Text(_formatDate(customer['created_at']))),
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
