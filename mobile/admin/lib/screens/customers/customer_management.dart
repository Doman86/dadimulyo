import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';

class CustomerManagement extends StatefulWidget {
  const CustomerManagement({super.key});

  @override
  State<CustomerManagement> createState() => _CustomerManagementState();
}

class _CustomerManagementState extends State<CustomerManagement> {
  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadCustomers();
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Daftar Pelanggan',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: admin.customers.isEmpty
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
                      rows: admin.customers.map((customer) {
                        return DataRow(cells: [
                          DataCell(Text('${customer['id']}')),
                          DataCell(Text(customer['name'] ?? '-')),
                          DataCell(Text(customer['email'] ?? '-')),
                          DataCell(Text(customer['phone'] ?? '-')),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: customer['status'] == 'active'
                                    ? Colors.green[100]
                                    : Colors.red[100],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                customer['status'] ?? 'unknown',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: customer['status'] == 'active'
                                      ? Colors.green[700]
                                      : Colors.red[700],
                                ),
                              ),
                            ),
                          ),
                          DataCell(Text(customer['created_at'] ?? '-')),
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
