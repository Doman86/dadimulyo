import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../models/driver_salary.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class SalaryDetailScreen extends StatefulWidget {
  final DriverSalary salary;

  const SalaryDetailScreen({super.key, required this.salary});

  @override
  State<SalaryDetailScreen> createState() => _SalaryDetailScreenState();
}

class _SalaryDetailScreenState extends State<SalaryDetailScreen> {
  final _api = ApiClient();
  bool _paying = false;

  Future<void> _markAsPaid() async {
    final method = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Pilih Metode Pembayaran'),
        children: [
          SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, 'cash'),
            child: const Row(
              children: [
                Icon(Icons.money, size: 20),
                SizedBox(width: 12),
                Text('Tunai'),
              ],
            ),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, 'transfer'),
            child: const Row(
              children: [
                Icon(Icons.account_balance, size: 20),
                SizedBox(width: 12),
                Text('Transfer Bank'),
              ],
            ),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, 'ewallet'),
            child: const Row(
              children: [
                Icon(Icons.phone_android, size: 20),
                SizedBox(width: 12),
                Text('E-Wallet'),
              ],
            ),
          ),
        ],
      ),
    );

    if (method == null) return;

    setState(() => _paying = true);
    try {
      await _api.payDriverSalary(
        widget.salary.driverId,
        widget.salary.id,
        paymentMethod: method,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gaji berhasil ditandai sebagai dibayar.')),
        );
        Navigator.pop(context, true);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal memproses pembayaran.')),
        );
      }
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  void _shareSlip() {
    final s = widget.salary;
    final text = StringBuffer();
    text.writeln('═══════════════════════════════');
    text.writeln('         SLIP GAJI DRIVER');
    text.writeln('          DADI MULYO');
    text.writeln('═══════════════════════════════');
    text.writeln('');
    text.writeln('Driver    : ${s.driverName ?? '-'}');
    text.writeln('Periode   : ${s.period}');
    text.writeln('');
    text.writeln('── PENDAPATAN ──');
    if (s.baseSalary > 0) {
      text.writeln('Gaji Pokok        : ${_formatRupiah(s.baseSalary)}');
    }
    if (s.rentalCommission > 0) {
      text.writeln('Komisi Rental     : ${_formatRupiah(s.rentalCommission)}');
    }
    if (s.deliveryCommission > 0) {
      text.writeln('Komisi Pengiriman : ${_formatRupiah(s.deliveryCommission)}');
    }
    if (s.bonusTarget > 0) {
      text.writeln('Bonus Target      : ${_formatRupiah(s.bonusTarget)}');
    }
    if (s.bonusRating > 0) {
      text.writeln('Bonus Rating      : ${_formatRupiah(s.bonusRating)}');
    }
    if (s.bonus > 0) {
      text.writeln('Bonus Lainnya     : ${_formatRupiah(s.bonus)}');
    }
    text.writeln('');
    text.writeln('── POTONGAN ──');
    if (s.lateDeduction > 0) {
      text.writeln('Keterlambatan     : -${_formatRupiah(s.lateDeduction)}');
    }
    if (s.complaintDeduction > 0) {
      text.writeln('Komplain          : -${_formatRupiah(s.complaintDeduction)}');
    }
    if (s.deduction > 0) {
      text.writeln('Lainnya           : -${_formatRupiah(s.deduction)}');
    }
    text.writeln('');
    text.writeln('═══════════════════════════════');
    text.writeln('TOTAL DITERIMA   : ${_formatRupiah(s.netSalary)}');
    text.writeln('═══════════════════════════════');
    text.writeln('');
    text.writeln('Status: ${s.statusLabel}');
    text.writeln('Dari: Dadi Mulyo - Showroom Truck & Jeruk');

    Share.share(text.toString(), subject: 'Slip Gaji ${s.period}');
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.salary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Slip Gaji'),
        actions: [
          IconButton(
            onPressed: _shareSlip,
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Bagikan',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ═══ Header ═══
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.forest],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Text(
                  'SLIP GAJI',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'DADI MULYO',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    s.period,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ═══ Info Driver ═══
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Informasi Driver',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                _infoRow('Nama Driver', s.driverName ?? '-'),
                _infoRow('Periode', s.period),
                _infoRow('Jumlah Rental', '${s.rentalCount} unit'),
                _infoRow('Jumlah Pengiriman', '${s.deliveryCount} trip'),
                _infoRow('Rating Rata-rata', '⭐ ${s.averageRating.toStringAsFixed(1)}'),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // ═══ Pendapatan ═══
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(Icons.trending_up, color: Colors.green[700], size: 18),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Pendapatan',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 20),
                if (s.baseSalary > 0)
                  _amountRow('💰 Gaji Pokok', s.baseSalary),
                if (s.rentalCommission > 0)
                  _amountRow('🚛 Komisi Rental', s.rentalCommission),
                if (s.deliveryCommission > 0)
                  _amountRow('📦 Komisi Pengiriman', s.deliveryCommission),
                if (s.totalBonus > 0) ...[
                  const Divider(height: 16),
                  const Text(
                    'Bonus',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (s.bonusTarget > 0)
                    _amountRow('🎯 Bonus Target', s.bonusTarget),
                  if (s.bonusRating > 0)
                    _amountRow('⭐ Bonus Rating', s.bonusRating),
                  if (s.bonus > 0)
                    _amountRow('🎁 Bonus Lainnya', s.bonus),
                ],
              ],
            ),
          ),

          const SizedBox(height: 12),

          // ═══ Potongan ═══
          if (s.totalDeduction > 0) ...[
            _card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(Icons.trending_down, color: Colors.red[700], size: 18),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Potongan',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  if (s.lateDeduction > 0)
                    _amountRow('⏰ Keterlambatan', -s.lateDeduction, isDeduction: true),
                  if (s.complaintDeduction > 0)
                    _amountRow('⚠️ Komplain', -s.complaintDeduction, isDeduction: true),
                  if (s.deduction > 0)
                    _amountRow('📋 Lainnya', -s.deduction, isDeduction: true),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // ═══ Total ═══
          _card(
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'TOTAL DITERIMA',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  Text(
                    _formatRupiah(s.netSalary),
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ═══ Status & Aksi ═══
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Status Pembayaran',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    _statusBadge(s.status),
                  ],
                ),
                if (s.isPaid && s.paymentDate != null) ...[
                  const SizedBox(height: 8),
                  _infoRow('Tanggal Bayar', s.paymentDate!),
                ],
                if (s.isPaid && s.paymentMethod != null) ...[
                  _infoRow('Metode', _paymentMethodLabel(s.paymentMethod!)),
                ],
                if (s.isPending) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _paying ? null : _markAsPaid,
                      icon: _paying
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.payment, size: 18),
                      label: Text(_paying ? 'Memproses...' : 'Tandai Sudah Bayar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          if (s.notes != null && s.notes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Catatan',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    s.notes!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: child,
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _amountRow(String label, double amount, {bool isDeduction = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14),
          ),
          Text(
            _formatRupiah(amount),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDeduction ? Colors.red[700] : Colors.green[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color color;
    String label;
    switch (status) {
      case 'paid':
        color = Colors.green;
        label = 'Sudah Dibayar';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'Dibatalkan';
        break;
      default:
        color = Colors.orange;
        label = 'Belum Dibayar';
    }
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

  String _paymentMethodLabel(String method) {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'transfer':
        return 'Transfer Bank';
      case 'ewallet':
        return 'E-Wallet';
      default:
        return method;
    }
  }

  String _formatRupiah(double amount) {
    return 'Rp ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}';
  }
}
