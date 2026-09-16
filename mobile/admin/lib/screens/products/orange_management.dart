import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';
import 'product_form_dialog.dart';

class OrangeManagement extends StatefulWidget {
  const OrangeManagement({super.key});

  @override
  State<OrangeManagement> createState() => _OrangeManagementState();
}

class _OrangeManagementState extends State<OrangeManagement> {
  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadOranges();
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Daftar Produk Jeruk',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => showProductFormDialog(context, kind: 'orange'),
                icon: const Icon(Icons.add),
                label: const Text('Tambah Produk'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: admin.oranges.isEmpty
                ? const Center(child: Text('Belum ada produk jeruk'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('ID')),
                        DataColumn(label: Text('Nama')),
                        DataColumn(label: Text('Grade')),
                        DataColumn(label: Text('Harga/kg')),
                        DataColumn(label: Text('Stok')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: admin.oranges.map((orange) {
                        return DataRow(cells: [
                          DataCell(Text('${orange['id']}')),
                          DataCell(Text(orange['name'] ?? '-')),
                          DataCell(Text(orange['grade'] ?? '-')),
                          DataCell(Text(
                            'Rp ${orange['price_per_kg'] ?? 0}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )),
                          DataCell(Text('${orange['stock_kg'] ?? 0} kg')),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: orange['status'] == 'available'
                                    ? Colors.green[100]
                                    : Colors.red[100],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                orange['status'] ?? 'unknown',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: orange['status'] == 'available'
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
                                  onPressed: () => showProductFormDialog(context, kind: 'orange', existing: orange),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                                  onPressed: () => confirmDeleteProduct(context, kind: 'orange', item: orange),
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
