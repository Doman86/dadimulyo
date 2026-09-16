import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import 'payment_screen.dart';
import 'invoice_screen.dart';

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

  /// Refresh status pembayaran (misal: setelah kembali dari Snap Midtrans).
  Future<void> _refreshPaymentStatus() async {
    setState(() => _loading = true);
    await _loadOrder();

    if (!mounted) return;

    // Jika setelah refresh status pembayaran berubah jadi lunas, tampilkan notifikasi.
    if (_order != null && _order!.paymentStatus == 'paid') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pembayaran berhasil ditemukan.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  /// Lunasi sisa tagihan pesanan DP via Snap Midtrans.
  /// Backend mengarahkan ke Snap "-REMAIN" dengan nominal sisa otomatis.
  Future<void> _payRemainder(Order order) async {
    try {
      final result = await _api.createMidtransTransaction(order.id);
      if (!mounted) return;

      if (result['success'] == true) {
        final transaction = result['transaction'] ?? <String, dynamic>{};
        final redirectUrl = transaction['redirect_url'] ?? '';
        final uri = Uri.tryParse(redirectUrl);

        if (uri != null && await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          if (mounted) _loadOrder();
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tidak dapat membuka halaman pembayaran.')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Gagal membuat transaksi pelunasan.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Terjadi kesalahan. Silakan coba lagi.')),
        );
      }
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'processing':
        return Colors.purple;
      case 'shipping':
        return Colors.cyan;
      case 'delivered':
        return Colors.teal;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'processing':
        return 'Diproses';
      case 'shipping':
        return 'Dikirim';
      case 'delivered':
        return 'Diterima';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  String _paymentLabel(String status) {
    switch (status) {
      case 'unpaid':
        return 'Belum Bayar';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'dp_paid':
        return 'DP Dibayar (50%)';
      case 'failed':
        return 'Gagal';
      case 'paid':
        return 'Lunas';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status;
    }
  }

  Color _paymentColor(String status) {
    switch (status) {
      case 'paid':
        return Colors.green;
      case 'pending':
      case 'dp_paid':
        return Colors.amber;
      case 'failed':
      case 'unpaid':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _paymentMethodLabel(String? method) {
    switch (method) {
      case 'online':
        return 'Online (Midtrans)';
      case 'dp_online':
        return 'DP 50% (Midtrans)';
      case 'cod':
        return 'Bayar di Tempat (COD)';
      case 'face_to_face':
        return 'Face to Face';
      default:
        return method ?? '';
    }
  }

  Future<void> _showCancelDialog() async {
    final reasonCtrl = TextEditingController();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Batalkan Pesanan?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Alasan pembatalan:'),
            const SizedBox(height: 8),
            TextField(
              controller: reasonCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Masukkan alasan...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Tidak')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Ya, Batalkan', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        await _api.cancelOrder(_order!.id, reasonCtrl.text.trim());
        _loadOrder();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Pesanan berhasil dibatalkan.')),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gagal membatalkan pesanan.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Pesanan tidak ditemukan')),
      );
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
            // Status badges — order_status & payment_status dipisah + metode bayar.
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _badge(_statusLabel(order.status), _statusColor(order.status)),
                _badge(_paymentLabel(order.paymentStatus), _paymentColor(order.paymentStatus)),
                if (order.paymentMethod != null)
                  _badge(_paymentMethodLabel(order.paymentMethod), Colors.blueGrey),
              ],
            ),
            const SizedBox(height: 20),

            // Informasi pembayaran Midtrans (jika ada)
            if (_order != null && _order!.midtransOrderId != null) ...[
              const Text(
                'Transaksi Midtrans',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _infoRow('Order ID', _order!.midtransOrderId!),
                      if (_order!.midtransTransactionId != null)
                        _infoRow('Transaction ID', _order!.midtransTransactionId!),
                      if (_order!.paymentType != null)
                        _infoRow('Metode', _order!.paymentType!),
                      const Divider(height: 20),
                      if (_order!.paymentStatus != 'paid')
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _loading ? null : _refreshPaymentStatus,
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text('Cek Status Pembayaran'),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Items
            const Text(
              'Item Pesanan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...order.items.map(
              (item) => Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName ?? 'Produk',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          Text(
                            '${AppTheme.formatNumber(item.quantityKg)} kg × ${AppTheme.formatRupiah(item.pricePerKg)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      AppTheme.formatRupiah(item.subtotal),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            _summaryRow('Subtotal', AppTheme.formatRupiah(order.subtotal)),
            _summaryRow('Ongkir', AppTheme.formatRupiah(order.shippingCost)),
            if (order.isDp) ...[
              _summaryRow('DP 50% (dibayar)', AppTheme.formatRupiah(order.dpAmount)),
              _summaryRow('Sisa (belum dibayar)', AppTheme.formatRupiah(order.remainingAmount)),
            ],
            const Divider(),
            _summaryRow(
              'Total',
              AppTheme.formatRupiah(order.total),
              bold: true,
            ),

            const SizedBox(height: 20),

            // Address
            if (addr != null) ...[
              const Text(
                'Alamat Pengiriman',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${addr.recipientName ?? ''} · ${addr.phone ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          addr.address,
                          addr.city,
                          addr.province,
                          addr.postalCode,
                        ].where((e) => e != null && e.isNotEmpty).join(', '),
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Payment Button — order online (lunas sekali bayar) yang belum
            // dibayar, atau pesanan DP yang DP-nya sudah masuk (tombol pelunasan).
            // Face to face & COD dikonfirmasi admin saat pertemuan/pengiriman.
            if (order.paymentStatus != 'paid' &&
                order.paymentStatus != 'pending' &&
                (order.paymentMethod == null ||
                    order.paymentMethod == 'online' ||
                    (order.isDp && order.paymentStatus == 'dp_paid')) &&
                order.status != 'cancelled') ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    if (order.isDp) {
                      // DP: langsung ke Snap Midtrans untuk pelunasan sisa tagihan.
                      await _payRemainder(order);
                    } else {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PaymentScreen(order: order),
                        ),
                      );
                      _loadOrder(); // Sinkronkan status terbaru dari backend.
                    }
                  },
                  icon: const Icon(Icons.payment, size: 20),
                  label: Text(order.isDp && order.paymentStatus == 'dp_paid'
                      ? 'Lunasi Sisa ${AppTheme.formatRupiah(order.remainingAmount)}'
                      : 'Bayar Sekarang'),
                ),
              ),
            ],

            // Cancel Button — alur backend: pending & confirmed masih bisa dibatalkan.
            if (order.status == 'pending' || order.status == 'confirmed') ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  onPressed: () => _showCancelDialog(),
                  icon: const Icon(Icons.cancel_outlined, size: 20),
                  label: const Text('Batalkan Pesanan'),
                ),
              ),
            ],

            // Invoice Button
            if (order.status == 'completed' || order.status == 'confirmed' || order.status == 'processing' || order.status == 'shipping' || order.status == 'delivered') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => InvoiceScreen(order: order),
                      ),
                    );
                  },
                  icon: const Icon(Icons.receipt_long, size: 20),
                  label: const Text('Lihat Invoice'),
                ),
              ),
            ],

            // Notes
            if (order.notes != null && order.notes!.isNotEmpty) ...[
              const Text(
                'Catatan Pesanan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    order.notes!,
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
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
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: bold ? AppTheme.textPrimary : AppTheme.textSecondary,
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              fontSize: bold ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w500,
              color: bold ? AppTheme.primary : AppTheme.textPrimary,
              fontSize: bold ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
