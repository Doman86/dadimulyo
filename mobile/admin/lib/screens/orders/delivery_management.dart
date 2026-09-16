import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

/// Kelola pengiriman pesanan — paritas dengan AdminDeliveries web:
/// buat pengiriman, tugaskan truck & sopir, ubah status, hapus.
class DeliveryManagement extends StatefulWidget {
  const DeliveryManagement({super.key});

  @override
  State<DeliveryManagement> createState() => _DeliveryManagementState();
}

class _DeliveryManagementState extends State<DeliveryManagement> {
  String _filterStatus = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final admin = context.read<AdminProvider>();
      admin.loadDeliveries();
      admin.loadOrders();
      admin.loadTrucks();
      admin.loadUsers(role: 'driver');
    });
  }

  static const _statusLabels = <String, String>{
    'pending': 'Menunggu',
    'assigned': 'Truck Ditugaskan',
    'in_transit': 'Dalam Perjalanan',
    'delivered': 'Terkirim',
    'cancelled': 'Dibatalkan',
  };

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'assigned': return Colors.blue;
      case 'in_transit': return Colors.purple;
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _orderNumber(Map<String, dynamic> delivery) {
    final order = delivery['order'];
    if (order is Map) return order['order_number']?.toString() ?? '-';
    return 'Pengiriman #${delivery['id']}';
  }

  String _truckName(Map<String, dynamic> delivery) {
    final truck = delivery['truck'];
    if (truck is Map) return '${truck['brand'] ?? ''} ${truck['model'] ?? ''}'.trim();
    return 'Truck belum ditugaskan';
  }

  String _driverName(Map<String, dynamic> delivery) {
    final driver = delivery['driver'];
    if (driver is Map) return driver['name']?.toString() ?? '-';
    return '-';
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('d MMM yyyy', 'id').format(parsed);
  }

  Future<void> _createDelivery() async {
    final admin = context.read<AdminProvider>();
    final orders = admin.orders.where((o) => o['status'] != 'cancelled').toList();
    final trucks = admin.trucks;
    final drivers = admin.users;

    if (orders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Belum ada pesanan untuk dikirim.'), backgroundColor: Colors.orange),
      );
      return;
    }

    int? orderId = orders.first['id'] as int;
    int? truckId = trucks.isNotEmpty ? trucks.first['id'] as int : null;
    int? driverId = drivers.isNotEmpty && drivers.first['id'] is int ? drivers.first['id'] as int : null;
    final pickupCtrl = TextEditingController(text: 'Kebun Dadi Mulyo, Wagir, Malang');
    final destCtrl = TextEditingController();
    final costCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    DateTime? scheduledAt = DateTime.now();

    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Buat Pengiriman'),
          content: SizedBox(
            width: 400,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    initialValue: orderId,
                    decoration: const InputDecoration(labelText: 'Pesanan *'),
                    items: orders
                        .map((o) => DropdownMenuItem(
                              value: o['id'] as int,
                              child: Text('${o['order_number'] ?? o['id']}'),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => orderId = v),
                  ),
                  DropdownButtonFormField<int?>(
                    initialValue: truckId,
                    decoration: const InputDecoration(labelText: 'Truck'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Tanpa truck')),
                      ...trucks.map((t) => DropdownMenuItem(
                            value: t['id'] as int,
                            child: Text('${t['brand']} ${t['model']}'),
                          )),
                    ],
                    onChanged: (v) => setState(() => truckId = v),
                  ),
                  DropdownButtonFormField<int?>(
                    initialValue: driverId,
                    decoration: const InputDecoration(labelText: 'Sopir'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Tanpa sopir')),
                      ...drivers.map((d) => DropdownMenuItem(
                            value: d['id'] as int,
                            child: Text(d['name']?.toString() ?? '-'),
                          )),
                    ],
                    onChanged: (v) => setState(() => driverId = v),
                  ),
                  TextField(controller: pickupCtrl, decoration: const InputDecoration(labelText: 'Ambil dari')),
                  TextField(controller: destCtrl, decoration: const InputDecoration(labelText: 'Tujuan')),
                  TextField(
                    controller: costCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Ongkir (Rp)'),
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('Jadwal: ${DateFormat('d MMM yyyy', 'id').format(scheduledAt!)}'),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate: scheduledAt!,
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) setState(() => scheduledAt = picked);
                    },
                  ),
                  TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Catatan')),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );

    if (created != true || !mounted) return;

    setState(() => _busy = true);
    final ok = await admin.saveDelivery(id: null, data: {
      'order_id': orderId,
      'truck_id': truckId,
      'driver_id': driverId,
      'pickup_address': pickupCtrl.text.trim().isEmpty ? null : pickupCtrl.text.trim(),
      'destination_address': destCtrl.text.trim().isEmpty ? null : destCtrl.text.trim(),
      'shipping_cost': costCtrl.text.trim().isEmpty ? null : num.tryParse(costCtrl.text.trim()),
      'scheduled_at': DateFormat('yyyy-MM-dd').format(scheduledAt!),
      'notes': notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Pengiriman dibuat.' : (admin.error ?? 'Gagal membuat pengiriman.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  Future<void> _editDelivery(Map<String, dynamic> delivery) async {
    final admin = context.read<AdminProvider>();
    final trucks = admin.trucks;
    final drivers = admin.users;

    String status = delivery['status']?.toString() ?? 'pending';
    int? truckId = delivery['truck_id'] as int?;
    int? driverId = delivery['driver_id'] as int?;
    final notesCtrl = TextEditingController(text: delivery['notes']?.toString() ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('Kelola Pengiriman #${delivery['id']}'),
          content: SizedBox(
            width: 360,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: _statusLabels.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => status = v ?? status),
                ),
                DropdownButtonFormField<int?>(
                  initialValue: truckId,
                  decoration: const InputDecoration(labelText: 'Truck'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Tanpa truck')),
                    ...trucks.map((t) => DropdownMenuItem(
                          value: t['id'] as int,
                          child: Text('${t['brand']} ${t['model']}'),
                        )),
                  ],
                  onChanged: (v) => setState(() => truckId = v),
                ),
                DropdownButtonFormField<int?>(
                  initialValue: driverId,
                  decoration: const InputDecoration(labelText: 'Sopir'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Tanpa sopir')),
                    ...drivers.map((d) => DropdownMenuItem(
                          value: d['id'] as int,
                          child: Text(d['name']?.toString() ?? '-'),
                        )),
                  ],
                  onChanged: (v) => setState(() => driverId = v),
                ),
                TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Catatan')),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );

    if (saved != true || !mounted) return;

    setState(() => _busy = true);
    final ok = await admin.saveDelivery(id: delivery['id'] as int, data: {
      'status': status,
      'truck_id': truckId,
      'driver_id': driverId,
      'notes': notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Pengiriman diperbarui.' : (admin.error ?? 'Gagal memperbarui pengiriman.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  Future<void> _deleteDelivery(Map<String, dynamic> delivery) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Pengiriman?'),
        content: Text('Pengiriman #${delivery['id']} akan dihapus permanen.'),
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
    final ok = await admin.deleteDelivery(delivery['id'] as int);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Pengiriman dihapus.' : (admin.error ?? 'Gagal menghapus pengiriman.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filtered = _filterStatus.isEmpty
        ? admin.deliveries
        : admin.deliveries.where((d) => d['status'] == _filterStatus).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Pengiriman',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadDeliveries(),
                icon: const Icon(Icons.refresh),
              ),
              ElevatedButton.icon(
                onPressed: _busy ? null : _createDelivery,
                icon: const Icon(Icons.add),
                label: const Text('Buat Pengiriman'),
              ),
              const SizedBox(width: 12),
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
                ? const Center(child: Text('Belum ada pengiriman'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Pesanan')),
                        DataColumn(label: Text('Truck')),
                        DataColumn(label: Text('Sopir')),
                        DataColumn(label: Text('Tujuan')),
                        DataColumn(label: Text('Ongkir')),
                        DataColumn(label: Text('Jadwal')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filtered.map((delivery) {
                        final status = delivery['status']?.toString() ?? 'pending';
                        final shippingCost = (delivery['shipping_cost'] as num?)?.toDouble() ?? 0;

                        return DataRow(cells: [
                          DataCell(Text(_orderNumber(delivery), style: const TextStyle(fontWeight: FontWeight.w600))),
                          DataCell(Text(_truckName(delivery))),
                          DataCell(Text(_driverName(delivery))),
                          DataCell(Text(
                            delivery['destination_address']?.toString() ?? '-',
                            style: const TextStyle(fontSize: 12),
                          )),
                          DataCell(Text(
                            shippingCost > 0
                                ? NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0).format(shippingCost)
                                : '-',
                          )),
                          DataCell(Text(_formatDate(delivery['scheduled_at']), style: const TextStyle(fontSize: 12))),
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
                          DataCell(
                            Row(
                              children: [
                                ElevatedButton(
                                  onPressed: _busy ? null : () => _editDelivery(delivery),
                                  child: const Text('Kelola'),
                                ),
                                IconButton(
                                  tooltip: 'Hapus',
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                  onPressed: _busy ? null : () => _deleteDelivery(delivery),
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
