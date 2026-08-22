import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final _api = ApiClient();
  Order? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    try {
      final result = await _api.getOrder(widget.orderId);
      setState(() {
        _order = Order.fromJson(result['data']);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
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
      case 'pending': return 'Pending';
      case 'confirmed': return 'Dikonfirmasi';
      case 'processing': return 'Diproses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  }

  String _paymentLabel(String status) {
    switch (status) {
      case 'unpaid': return 'Belum Bayar';
      case 'paid': return 'Lunas';
      case 'refunded': return 'Dikembalikan';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    }
    if (_order == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Pesanan tidak ditemukan')));
    }

    final order = _order!;
    final addr = order.shippingAddress;

    return Scaffold(
      appBar: AppBar(title: Text(order.orderNumber)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badges
            Row(
              children: [
                _badge(_statusLabel(order.status), _statusColor(order.status)),
                const SizedBox(width: 8),
                _badge(_paymentLabel(order.paymentStatus), Colors.grey),
              ],
            ),
            const SizedBox(height: 20),

            // Items
            const Text('Item Pesanan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...order.items.map((item) => Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.grey[200]!))),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.productName ?? 'Produk',
                                style: const TextStyle(fontWeight: FontWeight.w500)),
                            Text('${AppTheme.formatNumber(item.quantityKg)} kg × ${AppTheme.formatRupiah(item.pricePerKg)}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      Text(AppTheme.formatRupiah(item.subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                )),
            const SizedBox(height: 12),
            _summaryRow('Subtotal', AppTheme.formatRupiah(order.subtotal)),
            _summaryRow('Ongkir', AppTheme.formatRupiah(order.shippingCost)),
            const Divider(),
            _summaryRow('Total', AppTheme.formatRupiah(order.total), bold: true),

            const SizedBox(height: 20),

            // Address
            if (addr != null) ...[
              const Text('Alamat Pengiriman',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${addr.recipientName ?? ''} · ${addr.phone ?? ''}',
                          style: const TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(height: 4),
                      Text(
                        [
                          addr.address,
                          addr.city,
                          addr.province,
                          addr.postalCode,
                        ].where((e) => e != null && e.isNotEmpty).join(', '),
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Notes
            if (order.notes != null && order.notes!.isNotEmpty) ...[
              const Text('Catatan Pesanan',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(order.notes!, style: const TextStyle(color: AppTheme.textSecondary)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(
              color: bold ? AppTheme.textPrimary : AppTheme.textSecondary,
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              fontSize: bold ? 16 : 14)),
          Text(value, style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w500,
              color: bold ? AppTheme.primary : AppTheme.textPrimary,
              fontSize: bold ? 16 : 14)),
        ],
      ),
    );
  }
}
