import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  final _api = ApiClient();
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getOrders({'per_page': 20});
      setState(() {
        _orders = (result['data']?['data'] as List?)
                ?.map((e) => Order.fromJson(e))
                .toList() ??
            [];
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
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Pesanan')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Belum ada pesanan.', style: TextStyle(color: AppTheme.textSecondary)),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Belanja Jeruk'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _orders.length,
                    itemBuilder: (ctx, i) {
                      final order = _orders[i];
                      return GestureDetector(
                        onTap: () => Navigator.push(ctx,
                            MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
                        child: Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(order.orderNumber,
                                          style: const TextStyle(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 4),
                                      Text(
                                          '${order.items.length} item',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(AppTheme.formatRupiah(order.total),
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                              color: _statusColor(order.status).withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(4)),
                                          child: Text(_statusLabel(order.status),
                                              style: TextStyle(fontSize: 10, color: _statusColor(order.status), fontWeight: FontWeight.w600)),
                                        ),
                                        const SizedBox(width: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                              color: Colors.grey[200], borderRadius: BorderRadius.circular(4)),
                                          child: Text(_paymentLabel(order.paymentStatus),
                                              style: const TextStyle(fontSize: 10)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
