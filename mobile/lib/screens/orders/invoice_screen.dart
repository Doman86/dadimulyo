import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/app_config.dart';
import '../../models/order.dart';
import '../../services/invoice_pdf.dart';
import '../../widgets/app_theme.dart';

class InvoiceScreen extends StatelessWidget {
  final Order order;

  const InvoiceScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            tooltip: 'Cetak Invoice',
            onPressed: () async {
              try {
                await InvoicePdf.generateAndPrint(order);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal mencetak: $e')),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.download),
            tooltip: 'Simpan PDF',
            onPressed: () async {
              try {
                final file = await InvoicePdf.generateAndSave(order);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Tersimpan: ${file.path}')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menyimpan: $e')),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Share Invoice',
            onPressed: () async {
              try {
                final file = await InvoicePdf.generateAndSave(order);
                await SharePlus.instance.share(
                  ShareParams(
                    files: [XFile(file.path)],
                    text: 'Invoice ${order.orderNumber} - ${AppConfig.companyName}',
                  ),
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal share: $e')),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: '${AppConfig.companyName.split(' ')[0]} ',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primaryDark,
                              ),
                            ),
                            TextSpan(
                              text: AppConfig.companyName.split(' ').length > 1
                                  ? AppConfig.companyName.split(' ')[1]
                                  : '',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.gold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppConfig.addressFull,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                      Text(
                        AppConfig.contactPhone,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'INVOICE',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primary,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        order.orderNumber,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        _formatDate(order.createdAt),
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 20),
              Divider(color: Colors.grey[300]),
              const SizedBox(height: 16),

              // Status
              Row(
                children: [
                  _statusBadge('Status', _statusLabel(order.status), _statusColor(order.status)),
                  const SizedBox(width: 12),
                  _statusBadge('Pembayaran', _paymentLabel(order.paymentStatus),
                      order.paymentStatus == 'paid' ? Colors.green : Colors.orange),
                ],
              ),

              const SizedBox(height: 20),

              // Items table
              const Text(
                'Detail Pesanan',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[200]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    // Table header
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                      ),
                      child: const Row(
                        children: [
                          Expanded(flex: 3, child: Text('Produk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                          Expanded(flex: 1, child: Text('Qty', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                          Expanded(flex: 2, child: Text('Harga', textAlign: TextAlign.right, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                          Expanded(flex: 2, child: Text('Subtotal', textAlign: TextAlign.right, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                        ],
                      ),
                    ),
                    // Table rows
                    ...order.items.map(
                      (item) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border(top: BorderSide(color: Colors.grey[100]!)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Text(
                                item.productName ?? 'Produk',
                                style: const TextStyle(fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Expanded(
                              flex: 1,
                              child: Text(
                                '${AppTheme.formatNumber(item.quantityKg)} kg',
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                AppTheme.formatRupiah(item.pricePerKg),
                                textAlign: TextAlign.right,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                AppTheme.formatRupiah(item.subtotal),
                                textAlign: TextAlign.right,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Totals
              _summaryRow('Subtotal', AppTheme.formatRupiah(order.subtotal)),
              _summaryRow('Ongkir', AppTheme.formatRupiah(order.shippingCost)),
              Divider(color: Colors.grey[300]),
              _summaryRow(
                'TOTAL',
                AppTheme.formatRupiah(order.total),
                bold: true,
              ),

              const SizedBox(height: 20),

              // Shipping address
              if (order.shippingAddress != null) ...[
                const Text(
                  'Alamat Pengiriman',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  order.shippingAddress!.recipientName ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                ),
                Text(
                  order.shippingAddress!.phone ?? '',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                Text(
                  [
                    order.shippingAddress!.address,
                    order.shippingAddress!.city,
                    order.shippingAddress!.province,
                    order.shippingAddress!.postalCode,
                  ].where((e) => e != null && e.isNotEmpty).join(', '),
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],

              const SizedBox(height: 24),

              // Footer
              Center(
                child: Text(
                  'Terima kasih telah berbelanja di ${AppConfig.companyName}!',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              fontSize: bold ? 14 : 13,
              color: bold ? AppTheme.textPrimary : AppTheme.textSecondary,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w500,
              fontSize: bold ? 16 : 13,
              color: bold ? AppTheme.primary : AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
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
}
