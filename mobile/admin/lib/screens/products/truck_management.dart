import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';
import 'product_form_dialog.dart';

class TruckManagement extends StatefulWidget {
  const TruckManagement({super.key});

  @override
  State<TruckManagement> createState() => _TruckManagementState();
}

class _TruckManagementState extends State<TruckManagement> {
  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadTrucks();
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Daftar Truck',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => showProductFormDialog(context, kind: 'truck'),
                icon: const Icon(Icons.add),
                label: const Text('Tambah Truck'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Table
          Expanded(
            child: admin.trucks.isEmpty
                ? const Center(child: Text('Belum ada truck'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('ID')),
                        DataColumn(label: Text('Merek')),
                        DataColumn(label: Text('Model')),
                        DataColumn(label: Text('Tahun')),
                        DataColumn(label: Text('Harga')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: admin.trucks.map((truck) {
                        return DataRow(cells: [
                          DataCell(Text('${truck['id']}')),
                          DataCell(Text(truck['brand'] ?? '-')),
                          DataCell(Text(truck['model'] ?? '-')),
                          DataCell(Text('${truck['year'] ?? '-'}')),
                          DataCell(Text(
                            'Rp ${truck['price'] ?? 0}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: truck['status'] == 'available'
                                    ? Colors.green[100]
                                    : Colors.red[100],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                truck['status'] ?? 'unknown',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: truck['status'] == 'available'
                                      ? Colors.green[700]
                                      : Colors.red[700],
                                ),
                              ),
                            ),
                          ),
                          DataCell(
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit, size: 18),
                                  onPressed: () => showProductFormDialog(context, kind: 'truck', existing: truck),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                                  onPressed: () => confirmDeleteProduct(context, kind: 'truck', item: truck),
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
