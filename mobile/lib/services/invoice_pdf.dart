import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../config/app_config.dart';
import '../models/order.dart';

class InvoicePdf {
  static Future<void> generateAndPrint(Order order) async {
    final pdf = await _buildPdf(order);
    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'Invoice_${order.orderNumber}',
    );
  }

  static Future<File> generateAndSave(Order order) async {
    final pdf = await _buildPdf(order);
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/Invoice_${order.orderNumber}.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static Future<pw.Document> _buildPdf(Order order) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (context) => [
          // ── Header ──
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    AppConfig.companyName,
                    style: pw.TextStyle(
                      fontSize: 22,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#04150e'),
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    AppConfig.addressFull,
                    style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                  ),
                  pw.Text(
                    AppConfig.contactPhone,
                    style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                  ),
                  pw.Text(
                    AppConfig.contactEmail,
                    style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                  ),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    'INVOICE',
                    style: pw.TextStyle(
                      fontSize: 24,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#04150e'),
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    order.orderNumber,
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12),
                  ),
                  pw.Text(
                    _formatDate(order.createdAt),
                    style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                  ),
                ],
              ),
            ],
          ),

          pw.SizedBox(height: 20),
          pw.Divider(color: PdfColors.grey300),
          pw.SizedBox(height: 12),

          // ── Status ──
          pw.Row(
            children: [
              _statusBadge('Status', _statusLabel(order.status)),
              pw.SizedBox(width: 16),
              _statusBadge('Pembayaran', _paymentLabel(order.paymentStatus)),
            ],
          ),

          pw.SizedBox(height: 20),

          // ── Items Table ──
          pw.Text(
            'Detail Pesanan',
            style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 8),

          pw.TableHelper.fromTextArray(
            headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
            headerDecoration: const pw.BoxDecoration(
              color: PdfColor.fromHex('#f5f5f5'),
            ),
            headerAlignment: pw.Alignment.centerLeft,
            cellStyle: const pw.TextStyle(fontSize: 10),
            cellAlignment: pw.Alignment.centerLeft,
            cellHeight: 28,
            cellAlignments: {
              0: pw.Alignment.centerLeft,
              1: pw.Alignment.center,
              2: pw.Alignment.centerRight,
              3: pw.Alignment.centerRight,
            },
            headerAlignments: {
              0: pw.Alignment.centerLeft,
              1: pw.Alignment.center,
              2: pw.Alignment.centerRight,
              3: pw.Alignment.centerRight,
            },
            headers: ['Produk', 'Qty (kg)', 'Harga/kg', 'Subtotal'],
            data: order.items.map((item) => [
              item.productName ?? 'Produk',
              _formatNumber(item.quantityKg),
              _formatRupiah(item.pricePerKg),
              _formatRupiah(item.subtotal),
            ]).toList(),
          ),

          pw.SizedBox(height: 12),

          // ── Totals ──
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.end,
            children: [
              pw.SizedBox(
                width: 250,
                child: pw.Column(
                  children: [
                    _summaryRow('Subtotal', _formatRupiah(order.subtotal)),
                    _summaryRow('Ongkir', _formatRupiah(order.shippingCost)),
                    pw.Divider(color: PdfColors.grey300),
                    _summaryRow(
                      'TOTAL',
                      _formatRupiah(order.total),
                      bold: true,
                    ),
                  ],
                ),
              ),
            ],
          ),

          pw.SizedBox(height: 24),

          // ── Shipping Address ──
          if (order.shippingAddress != null) ...[
            pw.Text(
              'Alamat Pengiriman',
              style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 6),
            pw.Text(
              order.shippingAddress!.recipientName ?? '',
              style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11),
            ),
            pw.Text(
              order.shippingAddress!.phone ?? '',
              style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
            ),
            pw.Text(
              [
                order.shippingAddress!.address,
                order.shippingAddress!.city,
                order.shippingAddress!.province,
                order.shippingAddress!.postalCode,
              ].where((e) => e != null && e.isNotEmpty).join(', '),
              style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
            ),
          ],

          pw.SizedBox(height: 40),

          // ── Footer ──
          pw.Center(
            child: pw.Text(
              'Terima kasih telah berbelanja di ${AppConfig.companyName}!',
              style: pw.TextStyle(
                fontSize: 10,
                color: PdfColors.grey600,
                fontStyle: pw.FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );

    return pdf;
  }

  static pw.Widget _statusBadge(String label, String value) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label, style: pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
        pw.SizedBox(height: 2),
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: pw.BoxDecoration(
            color: PdfColor.fromHex('#f0f0f0'),
            borderRadius: pw.BorderRadius.circular(4),
          ),
          child: pw.Text(value, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
        ),
      ],
    );
  }

  static pw.Widget _summaryRow(String label, String value, {bool bold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
              fontSize: bold ? 12 : 11,
            ),
          ),
          pw.Text(
            value,
            style: pw.TextStyle(
              fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
              fontSize: bold ? 14 : 11,
            ),
          ),
        ],
      ),
    );
  }

  static String _formatRupiah(double amount) {
    return 'Rp ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}';
  }

  static String _formatNumber(double number) {
    return number.toStringAsFixed(number.truncateToDouble() == number ? 0 : 1);
  }

  static String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  static String _statusLabel(String status) {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Dikonfirmasi';
      case 'processing': return 'Diproses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  }

  static String _paymentLabel(String status) {
    switch (status) {
      case 'unpaid': return 'Belum Bayar';
      case 'paid': return 'Lunas';
      case 'refunded': return 'Dikembalikan';
      default: return status;
    }
  }
}
